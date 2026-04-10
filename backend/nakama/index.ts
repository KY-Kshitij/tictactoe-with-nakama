import { createMatchRpc, listMatchesRpc } from "./rpc";
import * as matchHandler from "./match_handler";

let InitModule: nkruntime.InitModule = function (
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    initializer: nkruntime.Initializer
) {
    logger.info("🚀 Initializing TicTacToe module");

    // ✅ Register RPCs
    initializer.registerRpc("createMatch", createMatchRpc);
    initializer.registerRpc("listMatches", listMatchesRpc);

    // ✅ Register Match Handler
    initializer.registerMatch("tic_tac_toe", matchHandler);

    // ✅ Register Matchmaker
    initializer.registerMatchmakerMatched(function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, matches: nkruntime.MatchmakerResult[]) {
        try {
            return nk.matchCreate('tic_tac_toe', {});
        } catch (e) {
            logger.error('Error creating matchmaking match %q', e);
            throw e;
        }
    });

    // ✅ Create leaderboard (VERY IMPORTANT)
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
};

export default InitModule;