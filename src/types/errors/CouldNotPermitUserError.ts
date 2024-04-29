export default class CouldNotPermitUserError extends Error {

    /**
     * The user that could not be permitted to join the voice channel
     */
    public user: string;

    /**
     * Creates a new instance of the CouldNotPermitUserError class
     * @param user The user that could not be permitted to join the voice channel
     */
    constructor(user: string) {
        super(`Could not permit user <@${user}> to join the voice channel.`);
        this.user = user;
    }
}