export default class NotInVoiceChannelError extends Error {
    /**
     * The user that is not in the voice channel.
     */
    public user: string | undefined;

    /**
     * The voice channel that the user is not in.
     */
    public voiceChannel: string | undefined;

    /**
     * Creates a new instance of the NotInVoiceChannelError class.
     * @param user The user that is not in the voice channel. If the user themselves is not in any voice channel, this parameter should be undefined.
     * @param voiceChannel The voice channel that the user is not in. If the user themselves is not in any voice channel, this parameter should be undefined.
     */
    constructor(user?: string, voiceChannel?: string) {
        super(`${user ? `<@${user}> is` : "You are"} currently not in ${voiceChannel ? `the voice channel <#${voiceChannel}>` : "a voice channel"}.`);
        this.user = user;
        this.voiceChannel = voiceChannel;
    }
}