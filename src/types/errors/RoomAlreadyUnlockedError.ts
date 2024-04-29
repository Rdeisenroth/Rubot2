export default class RoomAlreadyUnlockedError extends Error {
    /**
     * The room that is already unlocked
     */
    public roomId: string;

    constructor(roomId: string) {
        super(`The room <#${roomId}> is already unlocked.`);
        this.roomId = roomId;
    }
}