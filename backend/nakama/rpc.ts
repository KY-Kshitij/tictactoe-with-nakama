export const createMatchRpc: nkruntime.RpcFunction = (
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    payload: string
): string => {
    try {
        const matchId = nk.matchCreate("tic_tac_toe", {});
        return JSON.stringify({ matchId });
    } catch (error) {
        logger.error('Error creating match: %s', error);
        throw error;
    }
};

export const listMatchesRpc: nkruntime.RpcFunction = (
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    payload: string
): string => {
    try {
        const matches = nk.matchList(10, true, "tic_tac_toe", null, null, null);
        return JSON.stringify(matches);
    } catch (error) {
        logger.error('Error listing matches: %s', error);
        throw error;
    }
};
