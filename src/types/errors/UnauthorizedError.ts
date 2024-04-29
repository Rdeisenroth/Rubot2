export enum UnauthorizedErrorReason {
    CloseChannel = "close the channel",
    KickMember = "kick a member from the channel",
    KickOwner = "kick the owner of the channel",
    PermitMember = "permit a member to join the voice channel",
    LockChannel = "lock the channel",
    UnlockChannel = "unlock the channel",
    HideChannel = "hide the channel",
    ShowChannel = "show the channel",
}

export default class UnauthorizedError extends Error {
    constructor(reason: UnauthorizedErrorReason) {
        super(`You are not authorized to ${reason}.`);
    }
}