import { ApplicationCommandOptionType, Colors, EmbedBuilder } from "discord.js";
import { BaseCommand } from "@baseCommand";
import { Guild as DatabaseGuild } from "@models/Guild";
import { DocumentType, mongoose } from "@typegoose/typegoose";
import { Queue } from "@models/Queue";
import { QueueAlreadyExistsError } from "@types";

export default class CreateQueueCommand extends BaseCommand {
    public static name = "create";
    public static description = "Creates a new queue.";
    public static options = [
        {
            name: "name",
            description: "The name of the queue.",
            type: ApplicationCommandOptionType.String,
            required: true,
            default: "",
        },
        {
            name: "description",
            description: "The description of the queue.",
            type: ApplicationCommandOptionType.String,
            required: true,
            default: "",
        },
    ];

    /**
     * The guild saved in the database.s
     */
    private dbGuild!: DocumentType<DatabaseGuild>;

    public async execute() {
        await this.defer();
        if (!this.interaction.guild) {
            throw new Error("Interaction is not in a guild");
        }
        this.dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild)
        const queueName = await this.getOptionValue(CreateQueueCommand.options[0]);
        const queueDescription = await this.getOptionValue(CreateQueueCommand.options[1]);
        try {
            await this.createQueue(queueName, queueDescription);
        } catch (error) {
            if (error instanceof QueueAlreadyExistsError) {
                const embed = this.mountCreateQueueFailedEmbed(error.queueName);
                this.send({ embeds: [embed] });
                return;
            }
            throw error;
        }
        const embed = this.mountCreateQueueEmbed();
        this.send({ embeds: [embed] });    
    }

    /**
     * Returns the create queue embed to be sent to the user.
     * @returns The embed to be sent to the user.
     */
    private mountCreateQueueEmbed(): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle("Queue Created")
            .setDescription(`Queue ${this.dbGuild.queues[this.dbGuild.queues.length - 1].name} created.`)
        return embed
    }

    /**
     * Returns the create queue failed embed with the duplicate queue name to be sent to the user.
     * @param duplicateQueueName The name of the queue that already exists.
     * @returns The embed to be sent to the user.
     */
    private mountCreateQueueFailedEmbed(duplicateQueueName: string): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle("Queue Creation Failed")
            .setDescription(`Queue with name "${duplicateQueueName}" already exists.`)
            .setColor(Colors.Red)
        return embed
    }

    /**
     * Creates a queue on the database.
     * @param queueName The queue name.
     * @param queueDescription The queue description.
     */
    private async createQueue(queueName: string, queueDescription: string): Promise<void> {
        if (this.checkQueueName(queueName)) {
            this.app.logger.info(`Queue "${queueName}" already exists on guild "${this.interaction.guild?.name}" (id: ${this.interaction.guild?.id}). Aborting.`)
            throw new QueueAlreadyExistsError(queueName);
        }
        const queue: Queue = {
            name: queueName,
            description: queueDescription,
            disconnect_timeout: 60000,
            match_timeout: 120000,
            limit: 150,
            join_message: "You joined the ${name} queue.\n\\> Your Position: ${pos}/${total}\n\\> Total Time Spent: ${time_spent}",
            match_found_message: "You have found a Match with ${match}. Please Join ${match_channel} if you are not moved automatically. If you don't join in ${timeout} seconds, your position in the queue is dropped.",
            timeout_message: "Your queue Timed out after ${timeout} seconds.",
            leave_message: "You Left the `${name}` queue.\nTotal Time Spent: ${time_spent}",
            entries: new mongoose.Types.DocumentArray([]),
            opening_times: new mongoose.Types.DocumentArray([]),
            info_channels: [],
        }
        this.app.logger.debug(`Creating queue "${queueName}" on guild "${this.interaction.guild?.name}" (id: ${this.interaction.guild?.id})`)
        this.dbGuild.queues.push(queue);
        await this.dbGuild.save();
        this.app.logger.info(`Queue "${queueName}" created on guild "${this.interaction.guild?.name}" (id: ${this.interaction.guild?.id})`)
    }

    /**
     * Returns whether the queue name already exists on this guild.
     * 
     * The check is case insensitive.
     * @param queueName The queue name to check.
     * @returns Whether the queue name already exists on this guild.
     */
    private checkQueueName(queueName: string): boolean {
        return this.dbGuild.queues.some((queue) => queue.name.toLowerCase === queueName.toLowerCase);
    }
}