export default class RoomAlreadyLockedError extends Error {
    /**
     * The room that is already locked
     */
    public roomId: string;

    constructor(roomId: string) {
        super(`The room <#${roomId}> is already locked.`);
        this.roomId = roomId;
    }
}