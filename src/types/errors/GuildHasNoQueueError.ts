import { Guild } from "discord.js";

/**
 * Custom error class representing an error when a guild has no queue.
 */
export default class GuildHasNoQueueError extends Error {
    /**
     * Creates an instance of GuildHasNoQueueError.
     */
    constructor() {
        super(`The guild has no queue.`);
    }
}