import { BaseCommand } from "@baseCommand";
import { QueueEventType } from "@models/Event";
import { ChannelAlreadyInfoChannelError, CouldNotFindChannelError, CouldNotFindQueueError, InteractionNotInGuildError, InvalidEventError } from "@types";
import { ApplicationCommandOptionType, ChannelType, Colors, EmbedBuilder, TextChannel } from "discord.js";

export default class AddQueueInfoChannelCommand extends BaseCommand {
    public static name: string = "add_info_channel";
    public static description: string = "Adds a channel to the queue info channels.";
    public static options = [
        {
            name: "channel",
            description: "The channel to be added to the queue info channels.",
            type: ApplicationCommandOptionType.Channel,
            required: true,
        },
        {
            name: "queue",
            description: "The queue for which the info channel will be set.",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "events",
            description: `${Object.values(QueueEventType).join(", ")} (defaults to all)`,
            type: ApplicationCommandOptionType.String,
            required: false,
        }
    ]

    public async execute(): Promise<void> {
        await this.defer()

        if (!this.interaction.guild) {
            throw new InteractionNotInGuildError(this.interaction)
        }
        try {
            const dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild)

            // Get the options
            const channelId = this.getOptionValue(AddQueueInfoChannelCommand.options[0])
            const channel = this.interaction.guild.channels.cache.get(channelId)
            if (!channel) {
                throw new CouldNotFindChannelError(channelId)
            } else if (channel.type != ChannelType.GuildText) {
                throw new CouldNotFindChannelError(channelId, ChannelType.GuildText)
            }
            const queueName = this.getOptionValue(AddQueueInfoChannelCommand.options[1])
            const eventsString = this.getOptionValue(AddQueueInfoChannelCommand.options[2])
            const events = (!eventsString || eventsString === "*" || eventsString === "all")
                ? Object.values(QueueEventType)
                : eventsString.replace(/\s/g, "").split(",");

            // Add the channel to the queue info channels
            await this.app.queueManager.addQueueInfoChannel(dbGuild, queueName, channel, events)
            const embed = this.mountAddQueueInfoChannelEmbed(channel, queueName, events);
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
     * Builds and returns an embed for adding a queue info channel.
     * 
     * @param channel - The channel to be added.
     * @param queueName - The name of the queue.
     * @param events - The events associated with the queue.
     * @returns - The built embed.
     */
    private mountAddQueueInfoChannelEmbed(channel: TextChannel, queueName: string, events: string[]): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle("Queue Info Channel Added")
            .setDescription(`The channel ${channel.name ?? channel.id} was added to the queue ${queueName} info channels.`)
            .addFields({
                name: "Events",
                value: events.join(", ")
            })
            .setColor(Colors.Green)
        return embed
    }

    /**
     * Mounts an error embed based on the given error.
     * 
     * @param error - The error object.
     * @returns The error embed.
     * @throws The error object if it is not an instance of CouldNotFindChannelError, CouldNotFindQueueError, or ChannelAlreadyInfoChannelError.
     */
    private mountErrorEmbed(error: Error): EmbedBuilder {
        if (error instanceof CouldNotFindChannelError || error instanceof CouldNotFindQueueError || error instanceof ChannelAlreadyInfoChannelError || error instanceof InvalidEventError) {
            const embed = new EmbedBuilder()
                .setTitle("Error")
                .setDescription(error.message)
                .setColor(Colors.Red)
            return embed
        }
        throw error;
    }
}