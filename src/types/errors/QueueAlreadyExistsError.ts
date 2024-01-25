export default class QueueAlreadyExistsError extends Error {
    /**
     * The queue name which already exists.
     */
    public queueName: string;

    /**
     * Creates a new queue already exists error.
     * @param queueName The queue name which already exists.
     */
    constructor(queueName: string) {
        super(`Queue "${queueName}" already exists.`);
        this.queueName = queueName;
    }
}