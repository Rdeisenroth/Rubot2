import { BaseCommand } from "@baseCommand";
import { Queue } from "@models/Queue";
import { InteractionNotInGuildError } from "@types";
import { Colors, EmbedBuilder } from "discord.js";

export default class QueueListCommand extends BaseCommand {
    public static name = "list";
    public static description = "Lists all queues.";

    public async execute(): Promise<void> {
        try {
            const queues = await this.loadQueues();
            const embed = this.mountListEmbed(queues);
            await this.send({ embeds: [embed] });
        } catch (error) {
            if (error instanceof Error) {
                const embed = this.mountErrorEmbed(error);
                await this.send({ embeds: [embed] });
            } else {
                throw error;
            }
        }
    }

    /**
     * Mounts an embed with the list of queues.
     * 
     * @param queues - An array of Queue objects representing the queues available in the server.
     * @returns The EmbedBuilder object containing the formatted list of queues.
     */
    private mountListEmbed(queues: Queue[]): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle("Queue List")
            .setDescription("Here are all the queues available in this server.")
            .addFields(
                ...queues.map(queue => {
                    return {
                        name: queue.name + (queue.locked ? " (locked)" : ""),
                        value: queue.description ?? "",
                    };
                })
            )
            .setColor(Colors.Green);
        return embed;
    }

    /**
     * Mounts an error embed based on the given error.
     * If the error is not an instance of InteractionNotInGuildError, it throws the error.
     * Otherwise, it creates and returns an embed with the error message and a red color.
     * 
     * @param error - The error object.
     * @returns The error embed.
     */
    private mountErrorEmbed(error: Error): EmbedBuilder {
        if (!(error instanceof InteractionNotInGuildError)) {
            throw error;
        }
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription(error.message)
            .setColor(Colors.Red);
        return embed;
    }

    /**
     * Loads the queues from the database for the current guild.
     * @returns A promise that resolves to an array of Queue objects.
     * @throws {InteractionNotInGuildError} If the interaction is not in a guild.
     */
    private async loadQueues(): Promise<Queue[]> {
        if (!this.interaction.guild) {
            throw new InteractionNotInGuildError(this.interaction);
        }

        const dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild)
        return dbGuild.queues;
    }
}