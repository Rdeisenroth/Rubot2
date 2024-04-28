export default class NotInVoiceChannelError extends Error {
    /**
     * The user that is not in the voice channel.
     */
    public user: string | undefined;

    /**
     * Creates a new instance of the NotInVoiceChannelError class.
     * @param user The user that is not in the voice channel. If the user themselves is not in any voice channel, this parameter should be undefined.
     */
    constructor(user?: string) {
        super(`${user ? `<@${user}> is` : "You are"} currently not in a voice channel.`);
        this.user = user;
    }
}