export default class CouldNotKickAllUsersError extends Error {
    constructor() {
        super(`Could not kick all users from the voice channel.`);
    }
}