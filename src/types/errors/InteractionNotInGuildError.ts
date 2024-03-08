import { Interaction } from "discord.js";

/**
 * Error thrown when an interaction is not in a guild.
 */
export default class InteractionNotInGuildError extends Error {
    public interaction: Interaction;
    constructor(interaction: Interaction) {
        super(`Interaction ${interaction.id} is not in a guild`)
        this.interaction = interaction;
    }
}