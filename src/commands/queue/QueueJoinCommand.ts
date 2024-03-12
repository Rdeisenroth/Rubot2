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
    /**
     * The guild saved in the database.
     */
    private dbGuild!: DocumentType<DatabaseGuild>;
    
    public async execute(): Promise<void> {
        if (!this.interaction.guild) {
            throw new InteractionNotInGuildError(this.interaction);
        }
        this.dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild)
        const queueName = this.getOptionValue(QueueJoinCommand.options[0])
        const intent = this.getOptionValue(QueueJoinCommand.options[1])
        const user = this.interaction.user
        try {
            let joinMessage = await this.joinQueue(queueName, intent, user)
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

    private mountJoinQueueEmbed(joinMessage: string): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle("Queue Joined")
            .setDescription(joinMessage)
            .setColor(Colors.Green)
        return embed
    }

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

    private async joinQueue(queueName: string, intent: string, user: User): Promise<string> {
        const queueData = this.dbGuild.queues.find(x => x.name.toLowerCase() === queueName.toLowerCase());
        if (!queueData) {
            throw new CouldNotFindQueueError(queueName);
        }

        // check if already in queue
        const queueWithUser = this.dbGuild.queues.find(x => x.contains(user.id));
        if (queueWithUser) {
            throw new AlreadyInQueueError(queueWithUser.name);
        }

        // check if user has active tutor session
        const userData = await this.app.userManager.getUser(user);
        if (await userData.hasActiveSessions()) {
            throw new UserHasActiveSessionError();
        }

        // check if queue is locked
        if (queueData.locked) {
            throw new QueueLockedError(queueData.name);
        }

        // join the queue
        await queueData.join({
            discord_id: user.id,
            joinedAt: Date.now().toString(),
            importance: 1,
            intent: intent,
        })

        return queueData.getJoinMessage(user.id);
    }
}