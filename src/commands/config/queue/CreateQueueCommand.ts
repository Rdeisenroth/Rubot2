import { ApplicationCommandOptionType, Colors, EmbedBuilder } from "discord.js";
import { BaseCommand } from "@baseCommand";
import { Guild as DatabaseGuild } from "@models/Guild";
import { DocumentType, mongoose } from "@typegoose/typegoose";
import { Queue } from "@models/Queue";
import { InteractionNotInGuildError, QueueAlreadyExistsError } from "@types";
import { FilterOutFunctionKeys } from "@typegoose/typegoose/lib/types";

export default class CreateQueueCommand extends BaseCommand {
    public static name = "create";
    public static description = "Creates a new queue.";
    public static options = [
        {
            name: "name",
            description: "The name of the queue.",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "description",
            description: "The description of the queue.",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ];

    /**
     * The guild saved in the database.
     */
    private dbGuild!: DocumentType<DatabaseGuild>;

    public async execute() {
        await this.defer();
        if (!this.interaction.guild) {
            throw new InteractionNotInGuildError(this.interaction);
        }
        this.dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild)
        const queueName = this.getOptionValue(CreateQueueCommand.options[0]);
        const queueDescription = this.getOptionValue(CreateQueueCommand.options[1]);
        try {
            await this.app.queueManager.createQueue(this.dbGuild, queueName, queueDescription);
        } catch (error) {
            if (error instanceof QueueAlreadyExistsError) {
                const embed = this.mountCreateQueueFailedEmbed(error.queueName);
                this.send({ embeds: [embed] });
                return;
            }
            throw error;
        }
        const embed = this.mountCreateQueueEmbed();
        await this.send({ embeds: [embed] });   
    }

    /**
     * Returns the create queue embed to be sent to the user.
     * @returns The embed to be sent to the user.
     */
    private mountCreateQueueEmbed(): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle("Queue Created")
            .setDescription(`Queue "${this.dbGuild.queues[this.dbGuild.queues.length - 1].name}" created.`)
            .setColor(Colors.Green)
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
}