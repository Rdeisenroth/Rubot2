import { DocumentType } from "@typegoose/typegoose";
import { Session } from "@models/Session";

/**
 * Error thrown when a session has no queue.
 */
export default class SessionHasNoQueueError extends Error {
    /**
     * The session that has no queue.
     */
    public session: DocumentType<Session>;

    /**
     * Creates an instance of SessionHasNoQueueError.
     * @param session - The session that has no queue.
     */
    constructor(session: DocumentType<Session>) {
        super("Your session has no queue.");
        this.session = session;
    }
}