export default class CanNotTransferToYourselfError extends Error {
    constructor() {
        super("You can not transfer the ownership of the voice channel to yourself.");
    }
}