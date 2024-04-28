import { BaseCommand } from "@baseCommand";
import { VoiceChannel } from "@models/VoiceChannel";
import { ChannelNotTemporaryError, NotInVoiceChannelError, UnauthorizedError, UnauthorizedErrorReason } from "@types";
import { Colors, EmbedBuilder, GuildMember, VoiceBasedChannel } from "discord.js";

export default class VoiceLockCommand extends BaseCommand {
    public static name = "lock";
    public static description = "Locks the current voice channel.";
    public static options = [];

    public async execute(): Promise<void> {
        try {
            const dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild!);
            const member = this.interaction.member as GuildMember;
            const { voiceChannel, databaseVoiceChannel } = await this.app.roomManager.getTemporaryVoiceChannel(dbGuild, member);
            this.checkLockPermissions(member, databaseVoiceChannel);
            await this.app.roomManager.lockRoom(dbGuild, voiceChannel, databaseVoiceChannel, member);
            const embed = this.mountVoiceLockEmbed(voiceChannel);
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

    private mountVoiceLockEmbed(voiceChannel: VoiceBasedChannel): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle("Voice Channel Locked")
            .setDescription(`The voice channel "${voiceChannel}" was locked.`)
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

    private checkLockPermissions(member: GuildMember, databaseVoiceChannel: VoiceChannel) {
        // Check if user has permission to lock the channel
        if (!(databaseVoiceChannel.owner === member.id || (databaseVoiceChannel.supervisors && databaseVoiceChannel.supervisors.includes(member.id)))) {
            this.app.logger.debug(`User ${member.id} is not authorized to lock the channel ${databaseVoiceChannel._id}`);
            throw new UnauthorizedError(UnauthorizedErrorReason.LockChannel);
        }
    }
}