import { BaseCommand } from "@baseCommand";
import { InteractionNotInGuildError, CouldNotFindChannelError, CouldNotFindQueueError, ChannelNotInfoChannelError } from "@types";
import { ApplicationCommandOptionType, ChannelType, Colors, EmbedBuilder, TextChannel } from "discord.js";

export default class RemoveQueueInfoChannelCommand extends BaseCommand {
    public static name: string = "remove_info_channel";
    public static description: string = "Removes a channel from the queue info channels.";
    public static options = [
        {
            name: "channel",
            description: "The channel to be removed from the queue info channels.",
            type: ApplicationCommandOptionType.Channel,
            required: true,
        },
        {
            name: "queue",
            description: "The queue for which the info channel will be removed.",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ]

    public async execute(): Promise<void> {
        await this.defer()

        if (!this.interaction.guild) {
            throw new InteractionNotInGuildError(this.interaction)
        }
        try {
            const dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild)

            // Get the options
            const channelId = this.getOptionValue(RemoveQueueInfoChannelCommand.options[0])
            const channel = this.interaction.guild.channels.cache.get(channelId)
            if (!channel) {
                throw new CouldNotFindChannelError(channelId)
            } else if (channel.type != ChannelType.GuildText) {
                throw new CouldNotFindChannelError(channelId, ChannelType.GuildText)
            }
            const queueName = this.getOptionValue(RemoveQueueInfoChannelCommand.options[1])

            // Remove the channel from the queue info channels
            await this.app.queueManager.removeQueueInfoChannel(dbGuild, queueName, channel)
            const embed = this.mountRemoveQueueInfoChannelEmbed(channel, queueName);
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

    private mountRemoveQueueInfoChannelEmbed(channel: TextChannel, queueName: string): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle("Queue Info Channel Removed")
            .setColor(Colors.Green)
            .setDescription(`The channel "${channel.name ?? channel.id}" has been removed from the queue info channels for the queue "${queueName}".`)
    }

    private mountErrorEmbed(error: Error): EmbedBuilder {
        if (error instanceof CouldNotFindChannelError || error instanceof CouldNotFindQueueError || error instanceof ChannelNotInfoChannelError) {
            return new EmbedBuilder()
                .setTitle("Error")
                .setColor(Colors.Red)
                .setDescription(error.message)
        }
        throw error
    }

}