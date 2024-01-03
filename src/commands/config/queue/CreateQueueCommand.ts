import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { BaseCommand } from "../../../baseCommand";
import { Guild as DatabaseGuild } from "../../../models/Guild";
import { DocumentType, mongoose } from "@typegoose/typegoose";
import { Queue } from "../../../models/Queue";

export default class CreateQueueCommand extends BaseCommand {
    public static name = "create";
    public static description = "Create a queue.";
    public static options = [
        {
            name: "name",
            description: "The Queue Name",
            type: ApplicationCommandOptionType.String,
            required: true,
            default: "",
        },
        {
            name: "description",
            description: "The Queue Description",
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
        this.dbGuild = await this.client.configManager.getGuildConfig(this.interaction.guild)
        const queueName = await this.getOptionValue(CreateQueueCommand.options[0]);
        const queueDescription = await this.getOptionValue(CreateQueueCommand.options[1]);
        await this.createQueue(queueName, queueDescription);
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
     * Creates a queue on the database.
     * @param queueName The queue name.
     * @param queueDescription The queue description.
     */
    private async createQueue(queueName: string, queueDescription: string): Promise<void> {
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
        this.dbGuild.queues.push(queue);
        await this.dbGuild.save();
    }
}