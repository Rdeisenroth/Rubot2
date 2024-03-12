/**
 * Represents an error that occurs when a user is not in a queue.
 */
export default class NotInQueueError extends Error {
    /**
     * The name of the queue in which the user is not in.
     */
    public queueName: string | undefined;

    /**
     * Creates a new instance of the NotInQueueError class.
     * @param queueName The name of the queue in which the user is not in. If the user is not in any queue, this parameter should be undefined.
     */
    constructor(queueName?: string) {
        super(`You are currently not in ${queueName ? `the queue "${queueName}"` : `a queue`}.`);
        this.queueName = queueName;
    }
}