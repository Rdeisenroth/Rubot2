export default class QueueAlreadyExistsError extends Error {
    public queueName: string;

    constructor(queueName: string) {
        super(`Queue ${queueName} already exists.`);
        this.queueName = queueName;
    }
}