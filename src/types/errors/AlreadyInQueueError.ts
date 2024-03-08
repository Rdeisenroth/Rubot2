export default class AlreadyInQueueError extends Error {
    /**
     * The name of the queue in which the user is already in.
     */
    public queueName: string

    /**
     * Creates a new already in queue error.
     * @param queueName The name of the queue in which the user is already in.
     */
    constructor(queueName: string) {
        super(`You are already in the queue "${queueName}".`)
        this.queueName = queueName
    }
}