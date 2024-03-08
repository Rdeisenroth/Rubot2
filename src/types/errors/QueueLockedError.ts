/**
 * Represents an error that occurs when attempting to join a locked queue.
 */
export default class QueueLockedError extends Error {
    /**
     * The name of the queue which is locked.
     */
    public queueName: string

    /**
     * Creates a new queue locked error.
     * @param queueName The name of the queue which is locked.
     */
    constructor(queueName: string) {
        super(`The queue "${queueName}" is locked and cannot be joined.`)
        this.queueName = queueName
    }
}