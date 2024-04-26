/**
 * An error that is thrown when a voice channel could not be created for a queue.
 */
export default class ChannelCouldNotBeCreatedError extends Error {
    /**
     * The name of the queue for which the channel could not be created.
     */
    public queueName: string

    /**
     * The name of the guild in which the channel could not be created.
     */
    public guildName: string

    /**
     * Creates a new ChannelCouldNotBeCreatedError instance.
     * @param queueName The name of the queue for which the channel could not be created.
     * @param guildName The name of the guild in which the channel could not be created.
     */
    constructor(queueName: string, guildName: string) {
        super(`Failed to create temporary voice channel for queue "${queueName}" in guild "${guildName}".`)
        this.queueName = queueName
        this.guildName = guildName
    }
}