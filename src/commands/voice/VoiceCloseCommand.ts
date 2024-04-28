import { BaseCommand } from "@baseCommand";
import { ChannelNotTemporaryError, CouldNotKickUserError, NotInVoiceChannelError, UnauthorizedError, UnauthorizedErrorReason } from "@types";
import { Colors, EmbedBuilder, GuildMember, VoiceBasedChannel } from "discord.js";

export default class VoiceCloseCommand extends BaseCommand {
    public static name = "close";
    public static description = "Closes the temporary voice channel and kicks all members from it.";
    public static options = [];

    public async execute() {
        await this.defer();
        try {
            const voiceChannel = await this.getChannel()
            await this.app.roomManager.kickMembersFromRoom(voiceChannel, this.interaction.member as GuildMember);
            const embed = this.mountVoiceCloseEmbed(voiceChannel);
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

    private mountVoiceCloseEmbed(voiceChannel: VoiceBasedChannel): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle("Voice Channel Closed")
            .setDescription(`All Users were kicked from the voice channel "${voiceChannel.name}". The channel should close automatically.`)
            .setColor(Colors.Green);
        return embed;
    }

    private mountErrorEmbed(error: Error): EmbedBuilder {
        if (error instanceof NotInVoiceChannelError || error instanceof ChannelNotTemporaryError || error instanceof UnauthorizedError || error instanceof CouldNotKickUserError) {
            return new EmbedBuilder()
                .setTitle("Error")
                .setDescription(error.message)
                .setColor(Colors.Red);
        }
        throw error;
    }

    private async getChannel(): Promise<VoiceBasedChannel> {
        // Check if user is in Voice Channel
        const member = this.interaction.member as GuildMember | null;
        const channel = member?.voice.channel;
        if (!member || !channel) {
            this.app.logger.info("User is not in a voice channel.");
            throw new NotInVoiceChannelError();
        }

        // Get channel from DB
        const dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild!);
        const dbChannel = dbGuild.voice_channels.find(vc => vc._id === channel.id);

        if (!dbChannel?.temporary) {
            this.app.logger.info("Channel is not temporary.");
            throw new ChannelNotTemporaryError();
        }

        // Check if user has permission to close the channel
        if (!(dbChannel.owner === member.id || (dbChannel.supervisors && dbChannel.supervisors.includes(member.id)))) {
            this.app.logger.info("User is not authorized to close the channel.");
            throw new UnauthorizedError(UnauthorizedErrorReason.CloseChannel);
        }

        return channel;
    }
}