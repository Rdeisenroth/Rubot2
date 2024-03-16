/**
 * Error thrown when a user does not have an active session.
 */
export default class UserHasNoActiveSessionError extends Error {
    public constructor() {
        super("You do not have an active session.");
    }
}