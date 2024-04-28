export default class CouldNotKickUserError extends Error {
    /**
     * The user that could not be kicked from the voice channel.
     */
    public user: string;

    /**
     * Creates a new instance of the CouldNotKickUserError class.
     * @param user The user that could not be kicked from the voice channel
     */
    constructor(user: string) {
        super(`Could not kick user <@${user}> from the voice channel.`);
        this.user = user;
    }
}