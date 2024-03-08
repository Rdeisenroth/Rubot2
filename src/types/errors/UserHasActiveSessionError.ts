export default class UserHasActiveSessionError extends Error {
    constructor() {
        super(`You have an active session and cannot join a queue.`)
    }
}