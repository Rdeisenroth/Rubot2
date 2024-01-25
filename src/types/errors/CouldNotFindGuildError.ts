export default class CouldNotFindQueueError extends Error {
    /**
     * The name of the queue which could not be found.
     */
    public queueName: string

    /**
     * Creates a new could not find queue error.
     * @param queueName The name of the queue which could not be found.
     */
    constructor(queueName: string) {
        super(`Could not find queue "${queueName}".`)
        this.queueName = queueName
    }
}