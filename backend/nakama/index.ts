import { createMatchRpc, listMatchesRpc } from "./rpc";
import {
    matchInit,
    matchJoinAttempt,
    matchJoin,
    matchLeave,
    matchLoop,
    matchTerminate,
    matchSignal
} from "./match_handler";

const matchHandler = {
    matchInit,
    matchJoinAttempt,
    matchJoin,
    matchLeave,
    matchLoop,
    matchTerminate,
    matchSignal
};

const onMatchmakerMatched: nkruntime.MatchmakerMatchedFunction = (
    ctx,
    logger,
    nk,
    matches
) => {
    try {
        return nk.matchCreate("tic_tac_toe", {});
    } catch (e) {
        logger.error("Error creating matchmaking match %q", e);
        throw e;
    }
};

function InitModule(
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    initializer: nkruntime.Initializer
) {
    logger.info("🚀 Initializing TicTacToe module");

    initializer.registerRpc("createMatch", createMatchRpc);
    initializer.registerRpc("listMatches", listMatchesRpc);

    initializer.registerMatch("tic_tac_toe", matchHandler);

    initializer.registerMatchmakerMatched(onMatchmakerMatched);

    try {
        nk.leaderboardCreate(
            "tictactoe_wins",
            true,
            nkruntime.SortOrder.DESCENDING,
            nkruntime.Operator.BEST,
            "0 0 * * *",
            {}
        );
        logger.info("Leaderboard created");
    } catch (e) {
        logger.warn("Leaderboard already exists or failed");
    }
}

// @ts-ignore
!InitModule && InitModule;