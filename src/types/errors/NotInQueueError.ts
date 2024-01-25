export default class NotInQueueError extends Error {
    constructor() {
        super(`You are currently not in a queue.`);
    }
}