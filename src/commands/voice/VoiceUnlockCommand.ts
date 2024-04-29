import { BaseCommand } from "@baseCommand";
import { VoiceChannel } from "@models/VoiceChannel";
import { NotInVoiceChannelError, ChannelNotTemporaryError, UnauthorizedError, UnauthorizedErrorReason } from "@types";
import { Colors, EmbedBuilder, GuildMember, VoiceBasedChannel } from "discord.js";

export default class VoiceUnlockCommand extends BaseCommand {
    public static name = "unlock";
    public static description = "Unlocks the current voice channel.";
    public static options = [];

    public async execute(): Promise<void> {
        try {
            const dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild!);
            const member = this.interaction.member as GuildMember;
            const { voiceChannel, databaseVoiceChannel } = await this.app.roomManager.getTemporaryVoiceChannel(dbGuild, member);
            this.checkUnlockPermissions(member, databaseVoiceChannel);
            await this.app.roomManager.unlockRoom(dbGuild, voiceChannel, databaseVoiceChannel, member);
            const embed = this.mountVoiceUnlockEmbed(voiceChannel);
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

    private mountVoiceUnlockEmbed(voiceChannel: VoiceBasedChannel): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle("Voice Channel Unlocked")
            .setDescription(`The voice channel "${voiceChannel}" was unlocked.`)
            .setColor(Colors.Green);
        return embed;
    }

    private mountErrorEmbed(error: Error): EmbedBuilder {
        if (error instanceof NotInVoiceChannelError || error instanceof ChannelNotTemporaryError || error instanceof UnauthorizedError) {
            return new EmbedBuilder()
                .setTitle("Error")
                .setDescription(error.message)
                .setColor(Colors.Red);
        }
        throw error;
    }

    private checkUnlockPermissions(member: GuildMember, databaseVoiceChannel: VoiceChannel) {
        // Check if user has permission to unlock the channel
        if (!(databaseVoiceChannel.owner === member.id || (databaseVoiceChannel.supervisors && databaseVoiceChannel.supervisors.includes(member.id)))) {
            this.app.logger.debug(`User ${member.id} is not authorized to unlock the channel ${databaseVoiceChannel._id}`);
            throw new UnauthorizedError(UnauthorizedErrorReason.UnlockChannel);
        }
    }
}