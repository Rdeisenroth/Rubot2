export default class CouldNotFindQueueForSessionError extends Error {
    public constructor() {
        super("Could not find the queue for the session.");
    }
}