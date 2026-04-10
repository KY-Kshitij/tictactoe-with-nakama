const TICK_RATE = 10;

interface MatchState {
  board: (string | null)[];
  players: nkruntime.Presence[];
  marks: { [userId: string]: string };
  currentTurn: string | null;
  status: "waiting" | "playing" | "finished" | "player_disconnected";
  winner: string | null;
  timer: number;
  timerTicks: number;
  graceTicks: number;
  deadlinedPlayer: string | null;
}

export const matchInit = (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: {[key: string]: string}): {state: nkruntime.MatchState, tickRate: number, label: string} => {
    return {
        state: {
            board: Array(9).fill(null),
            players: [],
            marks: {},
            currentTurn: null,
            status: "waiting",
            winner: null,
            timer: 30,
            timerTicks: 0,
            graceTicks: 0,
            deadlinedPlayer: null,
        },
        tickRate: TICK_RATE,
        label: "tic_tac_toe"
    };
};

export const matchJoinAttempt = (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presence: nkruntime.Presence, metadata: {[key: string]: any}): {state: nkruntime.MatchState, accept: boolean, rejectMessage?: string} | null => {
    const matchState = state as MatchState;
    if (matchState.status === "player_disconnected") {
        if (presence.userId !== matchState.deadlinedPlayer) {
            return { state: matchState, accept: false, rejectMessage: "Match full" };
        }
    } else if (matchState.players.length >= 2) {
        return { state: matchState, accept: false, rejectMessage: "Match full" };
    }
    return { state: matchState, accept: true };
};

export const matchJoin = (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]): {state: nkruntime.MatchState} | null => {
    const matchState = state as MatchState;
    let stateChanged = false;

    if (matchState.status === "player_disconnected") {
        for (const presence of presences) {
            if (presence.userId === matchState.deadlinedPlayer) {
                matchState.players.push(presence);
                matchState.status = "playing";
                matchState.deadlinedPlayer = null;
                matchState.graceTicks = 0;
                stateChanged = true;
            }
        }
    } else {
        for (const presence of presences) {
            if (!matchState.players.find(p => p.userId === presence.userId)) {
                matchState.players.push(presence);
                if (matchState.players.length === 1) {
                    matchState.marks[presence.userId] = "X";
                } else if (matchState.players.length === 2) {
                    matchState.marks[presence.userId] = "O";
                }
                stateChanged = true;
            }
        }
        
        if (matchState.players.length === 2 && matchState.status === "waiting") {
            matchState.status = "playing";
            matchState.currentTurn = matchState.players[0].userId;
            matchState.timer = 30;
            matchState.timerTicks = 0;
            stateChanged = true;
        }
    }
    
    if (stateChanged) {
        dispatcher.broadcastMessage(1, JSON.stringify(matchState));
    }
    
    return { state: matchState };
};

export const matchLeave = (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]): {state: nkruntime.MatchState} | null => {
    const matchState = state as MatchState;
    
    for (const presence of presences) {
        matchState.players = matchState.players.filter(p => p.userId !== presence.userId);
        
        if (matchState.status === "playing") {
             matchState.status = "player_disconnected";
             matchState.deadlinedPlayer = presence.userId;
             matchState.graceTicks = 10 * TICK_RATE;
             dispatcher.broadcastMessage(1, JSON.stringify(matchState));
        } else if (matchState.status === "player_disconnected") {
             matchState.status = "finished";
        }
    }

    if (matchState.players.length === 0) {
        return null; 
    }

    return { state: matchState };
};

export const matchLoop = (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, messages: nkruntime.MatchMessage[]): {state: nkruntime.MatchState} | null => {
    const matchState = state as MatchState;
    
    let broadcastFlag = false;

    if (matchState.status === "player_disconnected") {
        matchState.graceTicks--;
        if (matchState.graceTicks <= 0) {
            matchState.status = "finished";
            if (matchState.players.length > 0) {
                matchState.winner = matchState.players[0].userId;
                try {
                    nk.leaderboardRecordWrite("tictactoe_wins", matchState.winner, matchState.players[0].username, 1);
                } catch (e) {}
            } else {
                matchState.winner = "draw";
            }
            dispatcher.broadcastMessage(1, JSON.stringify(matchState));
            return null;
        }
        if (tick % 5 === 0) broadcastFlag = true;
    }
    else if (matchState.status === "playing") {
        matchState.timerTicks++;
        if (matchState.timerTicks >= TICK_RATE) {
            matchState.timerTicks = 0;
            matchState.timer--;
            if (matchState.timer <= 0) {
                matchState.status = "finished";
                matchState.winner = matchState.players.find(p => p.userId !== matchState.currentTurn)?.userId || null;
                const winnerObj = matchState.players.find(p => p.userId === matchState.winner);
                if (matchState.winner && winnerObj) {
                    try {
                        nk.leaderboardRecordWrite("tictactoe_wins", matchState.winner, winnerObj.username, 1);
                    } catch (e) {}
                }
                dispatcher.broadcastMessage(1, JSON.stringify(matchState));
                return null; 
            }
        }
        if (tick % 5 === 0) broadcastFlag = true;
    }
    
    let stateChanged = false;

    for (const message of messages) {
        if (message.opCode === 2) { 
            const data = JSON.parse(nk.binaryToString(message.data));
            if (matchState.status === "playing" && message.sender.userId === matchState.currentTurn) {
                const idx = data.position;
                if (matchState.board[idx] === null) {
                    matchState.board[idx] = matchState.marks[message.sender.userId];
                    stateChanged = true;
                    
                    if (checkWin(matchState.board)) {
                        matchState.status = "finished";
                        matchState.winner = message.sender.userId;
                        try {
                            nk.leaderboardRecordWrite("tictactoe_wins", message.sender.userId, message.sender.username, 1);
                        } catch (e) {}
                    } else if (matchState.board.every(cell => cell !== null)) {
                        matchState.status = "finished";
                        matchState.winner = "draw";
                    } else {
                        matchState.currentTurn = matchState.players.find(p => p.userId !== message.sender.userId)?.userId || null;
                        matchState.timer = 30;
                        matchState.timerTicks = 0;
                    }
                }
            }
        }
    }
    
    if (stateChanged || broadcastFlag) {
        dispatcher.broadcastMessage(1, JSON.stringify(matchState));
    }
    
    if (matchState.status === "finished") {
        return null;
    }
    
    return { state: matchState };
};

export const matchTerminate = (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, graceSeconds: number): {state: nkruntime.MatchState} | null => {
    return { state: state as MatchState };
};

export const matchSignal = (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, data: string): {state: nkruntime.MatchState, data?: string} | null => {
    return { state: state as MatchState, data };
};

function checkWin(board: (string | null)[]): boolean {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return true;
        }
    }
    return false;
}
