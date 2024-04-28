import { BaseCommand } from "@baseCommand";
import { VoiceChannel } from "@models/VoiceChannel";
import { ChannelNotTemporaryError, CouldNotKickUserError, NotInVoiceChannelError, UnauthorizedError, UnauthorizedErrorReason } from "@types";
import { Colors, EmbedBuilder, GuildMember, VoiceBasedChannel } from "discord.js";

export default class VoiceCloseCommand extends BaseCommand {
    public static name = "close";
    public static description = "Closes the temporary voice channel and kicks all members from it.";
    public static options = [];

    public async execute() {
        await this.defer();
        try {
            const dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild!);
            const member = this.interaction.member as GuildMember;
            const { voiceChannel, databaseVoiceChannel } = await this.app.roomManager.getTemporaryVoiceChannel(dbGuild, member);
            this.checkClosePermissions(member, databaseVoiceChannel);
            await this.app.roomManager.kickMembersFromRoom(voiceChannel, member);
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

    private checkClosePermissions(member: GuildMember, databaseVoiceChannel: VoiceChannel) {
        // Check if user has permission to close the channel
        if (!(databaseVoiceChannel.owner === member.id || (databaseVoiceChannel.supervisors && databaseVoiceChannel.supervisors.includes(member.id)))) {
            throw new UnauthorizedError(UnauthorizedErrorReason.CloseChannel);
        }
    } 
}