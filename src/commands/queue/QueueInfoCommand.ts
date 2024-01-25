import { BaseCommand } from "@baseCommand";
import { Queue } from "@models/Queue";
import { DocumentType } from "@typegoose/typegoose";
import { NotInQueueError } from "@types";
import { Colors, EmbedBuilder } from "discord.js";

export default class QueueInfoCommand extends BaseCommand {
    public static name = "info";
    public static description = "Displays information about the queue.";
    public static options = [];

    public async execute(): Promise<void> {
        try {
            const { queue, position } = await this.loadQueueAndPosition();
            const embed = this.mountInfoEmbed(queue, position);
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

    private async loadQueueAndPosition(): Promise<{ queue: DocumentType<Queue>, position: number }> {
        if (!this.interaction.guild) {
            throw new Error("Interaction is not in a guild");
        }
        const user = this.interaction.user;
        const dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild)
        const queueData = dbGuild.queues.find(x => x.contains(user.id));
        if (!queueData) {
            this.app.logger.info(`User ${user.username} (id: ${user.id}) tried to get queue info but is not in a queue`);
            throw new NotInQueueError();
        }

        const queuePosition = queueData.getPosition(user.id);
        return { queue: queueData, position: queuePosition };
    }


    private mountInfoEmbed(queue: DocumentType<Queue>, position: number): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle("Queue Information")
            .addFields(
                { name: "❯ Name", value: `${queue.name}` },
                { name: "❯ Description", value: `${queue.description}` },
                { name: "❯ Active Entries", value: `${queue.entries.length}` },
                { name: "❯ Your Position", value: `${position}/${queue.entries.length}` },
            )
        return embed
    }

    private mountErrorEmbed(error: Error): EmbedBuilder {
        if (!(error instanceof NotInQueueError)) {
            throw error;
        }
        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription(error.message)
            .setColor(Colors.Red)
        return embed
    }
}