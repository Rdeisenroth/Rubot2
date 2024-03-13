/**
 * Represents an error that occurs when trying to set a channel as an info channel, but it is already an info channel.
 */
export default class ChannelAlreadyInfoChannelError extends Error {
    /**
     * The name of the queue which is already an info channel.
     */
    public queueName: string

    /**
     * The name of the channel which is already an info channel.
     */
    public channelName: string

    /**
     * Creates a new ChannelAlreadyInfoChannelError instance.
     * @param queueName The name of the queue which is already an info channel.
     * @param channelName The name of the channel which is already an info channel.
     */
    constructor(queueName: string, channelName: string) {
        super(`The channel "${channelName}" is already a queue info channel for the queue "${queueName}".`)
        this.queueName = queueName
        this.channelName = channelName
    }
}