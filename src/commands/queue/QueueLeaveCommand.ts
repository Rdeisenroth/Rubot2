import { BaseCommand } from "@baseCommand";
import { Guild as DatabaseGuild } from "@models/Guild";
import { DocumentType } from "@typegoose/typegoose";
import { CouldNotFindQueueError, InteractionNotInGuildError, NotInQueueError } from "@types";
import { ApplicationCommandOptionType, Colors, EmbedBuilder, User } from "discord.js";

export default class QueueLeaveCommand extends BaseCommand {
    public static name = "leave";
    public static description = "Leaves the queue.";

    public async execute(): Promise<void> {
        if (!this.interaction.guild) {
            throw new InteractionNotInGuildError(this.interaction);
        }
        const dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild)
        const user = this.interaction.user
        try {
            let leaveMessage = await this.app.queueManager.leaveQueue(dbGuild, user)
            const embed = this.mountLeaveQueueEmbed(leaveMessage);
            await this.send({ embeds: [embed] })
        } catch (error) {
            if (error instanceof Error) {
                const embed = this.mountErrorEmbed(error);
                await this.send({ embeds: [embed] })
            } else {
                throw error;
            }
        }
    }

    /**
     * Mounts the leave queue embed.
     * 
     * @param leaveMessage - The message to be displayed in the embed.
     * @returns The constructed EmbedBuilder object.
    */
    private mountLeaveQueueEmbed(leaveMessage: string): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle("Queue Left")
            .setDescription(leaveMessage)
            .setColor(Colors.Green)
        return embed
    }

    /**
     * Creates an error embed based on the given error.
     * Throws an error if the given error is not an instance of NotInQueueError.
     * @param error - The error object.
     * @returns The error embed.
     */
    private mountErrorEmbed(error: Error): EmbedBuilder {
        if (error instanceof NotInQueueError) {
            const embed = new EmbedBuilder()
                .setTitle("Error")
                .setDescription(error.message)
                .setColor(Colors.Red)
            return embed
        }
        throw error;
    }
}