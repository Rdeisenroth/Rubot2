export default class ChannelNotTemporaryError extends Error {
    constructor() {
        super(`The voice channel is not temporary.`);
    }
}