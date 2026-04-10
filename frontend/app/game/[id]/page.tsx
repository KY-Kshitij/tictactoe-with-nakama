"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { client } from "@/lib/nakama";
import { Session, Socket } from "@heroiclabs/nakama-js";

interface GameState {
    board: (string | null)[];
    players: {userId: string, username: string}[];
    marks: { [userId: string]: string };
    currentTurn: string | null;
    status: string;
    winner: string | null;
    timer: number;
}

export default function Game() {
    const params = useParams();
    const router = useRouter();
    const matchId = decodeURIComponent(params.id as string);
    
    const socketRef = useRef<Socket | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);

    useEffect(() => {
        let active = true;

        const initGame = async () => {
            const token = localStorage.getItem("sessionToken");
            if (!token) return router.push("/");
            
            try {
                const sess = Session.restore(token, "");
                setSession(sess);

                const socket = client.createSocket(client.useSSL, false);
                socketRef.current = socket;
                await socket.connect(sess, true);

                socket.onmatchdata = (matchData) => {
                    if (!active) return;
                    if (matchData.op_code === 1) {
                        const stateJSON = new TextDecoder().decode(matchData.data);
                        const state = JSON.parse(stateJSON);
                        setGameState(state);
                    }
                };

                if (matchId.includes(".")) {
                    await socket.joinMatch(matchId);
                } else {
                    await socket.joinMatch("", matchId); 
                }
            } catch(e) {
                console.error("Match join error", e);
                if (active) router.push("/");
            }
        };

        if (matchId) initGame();

        return () => {
             active = false;
             if (socketRef.current) {
                 socketRef.current.leaveMatch(matchId).catch(() => {});
                 socketRef.current.disconnect(false);
             }
        };
    }, [matchId, router]);

    const handleMove = (index: number) => {
        const socket = socketRef.current;
        if (!socket || !gameState || gameState.status !== "playing") return;
        if (gameState.currentTurn !== session?.user_id) return;
        if (gameState.board[index] !== null) return;

        const payload = JSON.stringify({ position: index });
        socket.sendMatchState(matchId, 2, payload);
    };

    if (!gameState || gameState.status === "waiting") {
        return (
            <div className="flex flex-col h-screen items-center justify-center space-y-6 text-center px-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                <p className="text-xl">Waiting for opponent...</p>
                <div className="bg-gray-800 px-6 py-4 rounded-xl flex flex-col items-center border border-gray-700 shadow-xl max-w-sm w-full">
                   <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Share this Room ID</p>
                   <p className="font-mono text-sm break-all bg-gray-900 p-3 rounded-lg text-green-400 w-full">{matchId}</p>
                </div>
                <button onClick={() => router.push("/")} className="mt-8 text-gray-500 hover:text-white transition underline">Leave Room</button>
            </div>
        );
    }

    if (gameState.status === "finished") {
        const resultText = gameState.winner === "draw" 
              ? "IT'S A DRAW!" 
              : gameState.winner === session?.user_id ? "WINNER!" : "DEFEAT!";

        return (
            <div className="flex flex-col h-screen items-center justify-center space-y-8 absolute inset-0 z-50 bg-gray-900 bg-opacity-95 backdrop-blur-sm">
                <h1 className={`text-6xl font-black tracking-tighter drop-shadow-2xl ${gameState.winner === session?.user_id ? 'text-green-400' : gameState.winner === 'draw' ? 'text-blue-400' : 'text-red-500'}`}>
                    {resultText}
                </h1>
                {gameState.winner === session?.user_id && <p className="text-xl text-green-300 font-bold drop-shadow">+1 Win added to Leaderboard</p>}
                <div className="flex flex-col space-y-4 pt-8">
                    <button onClick={() => router.push("/")} className="bg-gray-800 border border-gray-600 hover:bg-gray-700 px-10 py-4 rounded-xl text-lg font-bold transition shadow-lg">
                        Return to Menu
                    </button>
                </div>
            </div>
        );
    }

    if (gameState.status === "player_disconnected") {
        return (
            <div className="flex flex-col h-screen items-center justify-center space-y-8 absolute inset-0 z-50 bg-gray-900 bg-opacity-95 backdrop-blur-sm">
                <div className="animate-pulse flex flex-col items-center">
                    <h1 className="text-4xl font-bold text-yellow-500 mb-4 drop-shadow-lg">Opponent Disconnected!</h1>
                    <p className="text-gray-300 text-lg">Waiting for them to reconnect...</p>
                </div>
            </div>
        );
    }

    const myTurn = gameState.currentTurn === session?.user_id;
    const mySymbol = gameState.marks[session?.user_id || ""] || 'X';
    
    // Find opponent symbol mapping
    const opponentId = gameState.players.find(p => p.userId !== session?.user_id)?.userId || "";
    const opponentSymbol = gameState.marks[opponentId] || 'O';
    
    const opponent = gameState.players.find(p => p.userId !== session?.user_id);
    const me = gameState.players.find(p => p.userId === session?.user_id);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 pb-12">
            <div className="w-full max-w-lg flex justify-between items-center mb-12 px-6">
                <div className="flex flex-col items-center">
                    <span className={`text-4xl font-black ${mySymbol === 'X' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`}>{mySymbol}</span>
                    <span className="text-sm font-semibold text-gray-300 mt-2">{me?.username || "You"} (You)</span>
                </div>
                
                <div className="flex flex-col items-center bg-gray-800 px-8 py-3 rounded-2xl border border-gray-700 shadow-inner min-w-[140px]">
                    <span className={`text-xs font-black tracking-widest ${myTurn ? 'text-green-400 animate-pulse' : 'text-gray-500'}`}>
                        {myTurn ? "YOUR TURN" : "WAITING"}
                    </span>
                    <span className="text-2xl font-mono text-white mt-1">{gameState.timer}s</span>
                </div>

                <div className="flex flex-col items-center">
                    <span className={`text-4xl font-black ${opponentSymbol === 'X' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]' : 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'}`}>{opponentSymbol}</span>
                    <span className="text-sm font-semibold text-gray-300 mt-2">{opponent?.username || "Opp"}</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 bg-gray-800 p-4 rounded-3xl shadow-2xl border border-gray-700/50 relative">
                {gameState.board.map((cell, idx) => {
                    let cellColor = "";
                    let shadow = "";
                    if (cell === 'X') {
                        cellColor = "text-blue-400";
                        shadow = "drop-shadow-[0_0_12px_rgba(96,165,250,0.6)]";
                    } else if (cell === 'O') {
                        cellColor = "text-red-500";
                        shadow = "drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]";
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleMove(idx)}
                            disabled={!myTurn || cell !== null}
                            className={`w-28 h-28 sm:w-32 sm:h-32 text-7xl font-black flex items-center justify-center bg-gray-900 rounded-2xl transition-all duration-300 
                                ${cell === null && myTurn ? 'hover:bg-gray-700 hover:-translate-y-1 hover:shadow-lg cursor-pointer border border-gray-700/50' : 'cursor-default border border-transparent'}
                                ${!myTurn && cell === null ? 'opacity-50' : ''}`}
                        >
                            <span className={`${cellColor} ${shadow} transform transition-transform duration-300 scale-100`}>
                                 {cell}
                            </span>
                        </button>
                    );
                })}
            </div>
            
            <button onClick={() => router.push("/")} className="mt-16 py-3 px-6 rounded-full border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition font-medium text-sm">
                Leave Match
            </button>
        </div>
    );
}
