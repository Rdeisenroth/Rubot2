import { Queue } from "@models/Queue";

export default class QueueIsEmptyError extends Error {
    public queue: Queue;

    constructor(queue: Queue) {
        super(`The queue "${queue.name}" is empty.`);
        this.queue = queue;
    }
}