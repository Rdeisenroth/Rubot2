export default class ChannelNotInfoChannelError extends Error {
    /*
     * The name of the queue for which the channel is not an info channel.
     */
    public queueName: string

    /*
     * The name of the channel which is not an info channel.
     */
    public channelName: string

    constructor(queueName: string, channelName: string) {
        super(`The channel "${channelName}" is not a queue info channel for the queue "${queueName}".`)
        this.queueName = queueName
        this.channelName = channelName
    }

}