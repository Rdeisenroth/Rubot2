/**
 * Represents an error that occurs when a queue cannot be found.
 */
export default class CouldNotFindQueueError extends Error {
    /**
     * The name of the queue which could not be found.
     */
    public queueName: string

    /**
     * Creates a new CouldNotFindQueueError instance.
     * @param queueName The name of the queue which could not be found.
     */
    constructor(queueName: string) {
        super(`Could not find the queue "${queueName}".`)
        this.queueName = queueName
    }
}