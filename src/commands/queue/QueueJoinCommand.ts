import { BaseCommand } from "@baseCommand";
import { Guild as DatabaseGuild } from "@models/Guild";
import { DocumentType } from "@typegoose/typegoose";
import { AlreadyInQueueError, CouldNotFindQueueError, InteractionNotInGuildError, QueueLockedError, UserHasActiveSessionError } from "@types";
import { ApplicationCommandOptionType, Colors, EmbedBuilder, User } from "discord.js";

export default class QueueJoinCommand extends BaseCommand {
    public static name = "join";
    public static description = "Joins the queue.";
    public static options = [
        {
            name: "queue",
            description: "The queue to join.",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "intent",
            description: "The intent of joining the queue.",
            type: ApplicationCommandOptionType.String,
            required: false,
        }
    ];

    public async execute(): Promise<void> {
        if (!this.interaction.guild) {
            throw new InteractionNotInGuildError(this.interaction);
        }
        const queueName = this.getOptionValue(QueueJoinCommand.options[0])
        const intent = this.getOptionValue(QueueJoinCommand.options[1])
        const user = this.interaction.user
        try {
            const joinMessage = await this.joinQueue(queueName, intent, user)
            const embed = this.mountJoinQueueEmbed(joinMessage);
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
     * Mounts the join queue embed.
     * 
     * @param joinMessage - The message to be displayed in the embed.
     * @returns The constructed EmbedBuilder object.
    */
    private mountJoinQueueEmbed(joinMessage: string): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle("Queue Joined")
            .setDescription(joinMessage)
            .setColor(Colors.Green)
        return embed
    }


    /**
     * Creates an error embed based on the given error.
     * @param error - The error object.
     * @returns The error embed.
     * @throws The error object if it is not an instance of any known error types.
     */
    private mountErrorEmbed(error: Error): EmbedBuilder {
        if (error instanceof AlreadyInQueueError || error instanceof CouldNotFindQueueError || error instanceof QueueLockedError || error instanceof UserHasActiveSessionError) {
            const embed = new EmbedBuilder()
                .setTitle("Error")
                .setDescription(error.message)
                .setColor(Colors.Red)
            return embed
        }
        throw error;
    }

    /**
     * Joins the specified queue with the given parameters.
     * 
     * @param queueName - The name of the queue to join.
     * @param intent - The intent of the user joining the queue.
     * @param user - The user joining the queue.
     * @returns A promise that resolves to a string representing the join message.
     * @throws {CouldNotFindQueueError} if the specified queue does not exist.
     * @throws {AlreadyInQueueError} if the user is already in a queue.
     * @throws {UserHasActiveSessionError} if the user has an active tutor session.
     * @throws {QueueLockedError} if the queue is locked.
     */
    private async joinQueue(queueName: string, intent: string, user: User): Promise<string> {
        const dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild!)
        const queueData = this.app.queueManager.getQueue(dbGuild, queueName);

        // check if already in any queue
        const queueWithUser = this.app.queueManager.getQueueOfUser(dbGuild, user);
        if (queueWithUser) {
            this.app.logger.info(`User ${user.username} (id: ${user.id}) tried to join queue ${queueData.name} but is already in queue ${queueWithUser.name}`);
            throw new AlreadyInQueueError(queueWithUser.name);
        }

        // check if user has active tutor session
        const userData = await this.app.userManager.getUser(user);
        if (await userData.hasActiveSessions()) {
            this.app.logger.info(`User ${user.username} (id: ${user.id}) tried to join queue ${queueData.name} but has an active tutor session`);
            throw new UserHasActiveSessionError();
        }

        return this.app.queueManager.joinQueue(queueData, user, intent);
    }
}