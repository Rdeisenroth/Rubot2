export default class UserNotInGuildError extends Error {
    constructor() {
        super("The user is not in the guild.");
    }
}