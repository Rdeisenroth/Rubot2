import { BaseCommand } from "@baseCommand";
import { VoiceChannel } from "@models/VoiceChannel";
import { ChannelNotTemporaryError, NotInVoiceChannelError, UnauthorizedError, UnauthorizedErrorReason } from "@types";
import { Colors, EmbedBuilder, GuildMember, VoiceBasedChannel } from "discord.js";

export default class VoiceToggleLockCommand extends BaseCommand {
    public static name = "toggle_lock";
    public static description = "Locks or unlocks the current voice channel.";
    public static options = [];

    public async execute(): Promise<void> {
        try {
            const dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild!);
            const member = this.interaction.member as GuildMember;
            const { voiceChannel, databaseVoiceChannel } = await this.app.roomManager.getTemporaryVoiceChannel(dbGuild, member);
            const shouldLockChannel = !databaseVoiceChannel.locked;
            this.checkToggleLockPermissions(member, databaseVoiceChannel, shouldLockChannel);
            if (shouldLockChannel) {
                await this.app.roomManager.lockRoom(dbGuild, voiceChannel, databaseVoiceChannel, member);
            } else {
                await this.app.roomManager.unlockRoom(dbGuild, voiceChannel, databaseVoiceChannel, member);
            }
            const embed = this.mountVoiceToggleLockEmbed(voiceChannel, shouldLockChannel);
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

    private mountVoiceToggleLockEmbed(voiceChannel: VoiceBasedChannel, locked: boolean): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle(`Voice Channel ${locked ? "Locked" : "Unlocked"}`)
            .setDescription(`The voice channel "${voiceChannel}" was ${locked ? "locked" : "unlocked"}.`)
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

    private checkToggleLockPermissions(member: GuildMember, databaseVoiceChannel: VoiceChannel, lock: boolean) {
        // Check if user has permission to lock or unlock the channel
        if (!(databaseVoiceChannel.owner === member.id || (databaseVoiceChannel.supervisors && databaseVoiceChannel.supervisors.includes(member.id)))) {
            this.app.logger.debug(`User ${member.id} is not authorized to toggle the lock of the channel ${databaseVoiceChannel._id}`);
            throw new UnauthorizedError(lock ? UnauthorizedErrorReason.LockChannel : UnauthorizedErrorReason.UnlockChannel);
        }
    }
}