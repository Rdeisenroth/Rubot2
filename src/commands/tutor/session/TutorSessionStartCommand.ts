import { BaseCommand } from "@baseCommand";
import { Queue } from "@models/Queue";
import { CouldNotAssignRoleError, CouldNotFindQueueError, CouldNotFindRoleError, GuildHasNoQueueError, InteractionNotInGuildError, UserHasActiveSessionError } from "@types";
import { ApplicationCommandOptionType, Colors, EmbedBuilder } from "discord.js";
import { DocumentType } from "@typegoose/typegoose";
import { InternalRoles } from "@models/BotRoles";

/**
 * Represents a command to start a tutor session.
 */
export default class TutorSessionStartCommand extends BaseCommand {
    public static name = "start";
    public static description = "Starts a tutor session.";
    public static options = [
        {
            name: "queue",
            description: "The queue to start the tutor session for.",
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ];

    public async execute(): Promise<void> {
        await this.defer();
        try {
            const queue = await this.startTutorSession();
            const embed = this.mountStartTutorSessionEmbed(queue);
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
     * Mounts the embed for a successful tutor session start.
     * 
     * @param queue - The queue for the tutor session.
     * @returns The embed builder for the tutor session start.
     */
    private mountStartTutorSessionEmbed(queue: DocumentType<Queue>): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle("Tutor Session Started")
            .setDescription(`You have started a tutor session for queue "${queue.name}".`)
            .setColor(Colors.Green)
    }

    /**
     * Mounts the embed for an error during tutor session start.
     * 
     * @param error - The error that occurred.
     * @returns The embed builder for the error.
     */
    private mountErrorEmbed(error: Error): EmbedBuilder {
        if (error instanceof GuildHasNoQueueError || error instanceof CouldNotFindQueueError || error instanceof CouldNotAssignRoleError || error instanceof CouldNotFindRoleError || error instanceof UserHasActiveSessionError) {
            return new EmbedBuilder()
                .setTitle("Error")
                .setDescription(error.message)
                .setColor(Colors.Red)
        }
        throw error
    }

    /**
     * Starts the tutor session.
     * 
     * @returns The queue for the tutor session.
     */
    private async startTutorSession(): Promise<DocumentType<Queue>> {
        if (!this.interaction.guild) {
            throw new InteractionNotInGuildError(this.interaction);
        }
        const dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild);

        // check if guild has a queue
        if (!dbGuild.queues || dbGuild.queues.length === 0) {
            this.app.logger.info(`Guild ${dbGuild.name} (id: ${dbGuild.id}) has no queue.`);
            throw new GuildHasNoQueueError();
        }

        const queueName = this.getOptionValue(TutorSessionStartCommand.options[0])

        // get the queue or the first queue available if no queue name is provided
        let queue: DocumentType<Queue>;
        if (queueName != "") {
            this.app.logger.info(`Looking for queue ${queueName} in guild ${dbGuild.name} (id: ${dbGuild.id})`);
            queue = this.app.queueManager.getQueue(dbGuild, queueName);
        } else {
            this.app.logger.info(`No queue name provided, using the first queue available in guild ${dbGuild.name} (id: ${dbGuild.id})`);
            queue = dbGuild.queues[0];
        }

        // set active session role
        await this.app.userManager.assignRoleToUser(dbGuild, this.interaction.user, InternalRoles.ACTIVE_SESSION);

        // start tutor session
        await this.app.queueManager.startTutorSession(queue, this.interaction.user);
        return queue;
    }
}