export enum UnauthorizedErrorReason {
    CloseChannel = "close the channel",
}

export default class UnauthorizedError extends Error {
    constructor(reason: UnauthorizedErrorReason) {
        super(`You are not authorized to ${reason}.`);
    }
}