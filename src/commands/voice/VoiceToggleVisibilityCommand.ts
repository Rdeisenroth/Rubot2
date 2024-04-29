import { BaseCommand } from "@baseCommand";
import { VoiceChannel } from "@models/VoiceChannel";
import { NotInVoiceChannelError, ChannelNotTemporaryError, UnauthorizedError, UnauthorizedErrorReason } from "@types";
import { GuildMember, VoiceBasedChannel, EmbedBuilder, Colors } from "discord.js";

export default class VoiceToggleVisibilityCommand extends BaseCommand {
    public static name = "toggle_visibility";
    public static description = "Hides or shows the current voice channel.";
    public static options = [];

    public async execute(): Promise<void> {
        try {
            const dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild!);
            const member = this.interaction.member as GuildMember;
            const { voiceChannel, databaseVoiceChannel } = await this.app.roomManager.getTemporaryVoiceChannel(dbGuild, member);
            let shouldHideChannel = this.shouldHideChannel(voiceChannel);
            this.checkToggleVisibilityPermissions(member, databaseVoiceChannel, shouldHideChannel);
            if (shouldHideChannel) {
                await this.app.roomManager.hideRoom(dbGuild, voiceChannel, member);
            } else {
                await this.app.roomManager.showRoom(dbGuild, voiceChannel, member);
            }
            const embed = this.mountVoiceToggleVisibilityEmbed(voiceChannel, shouldHideChannel);
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

    private mountVoiceToggleVisibilityEmbed(voiceChannel: VoiceBasedChannel, hidden: boolean): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle(`Voice Channel ${hidden ? "Hidden" : "Visible"}`)
            .setDescription(`The voice channel "${voiceChannel}" is now ${hidden ? "hidden" : "visible"}.`)
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

    private shouldHideChannel(voiceChannel: VoiceBasedChannel): boolean {
        const voiceChannelOverwrites = voiceChannel.permissionOverwrites.cache.get(this.interaction.guild!.roles.everyone.id);
        if (voiceChannelOverwrites && voiceChannelOverwrites.deny.has("ViewChannel")) {
            return true;
        }
        return false;
    }

    private checkToggleVisibilityPermissions(member: GuildMember, databaseVoiceChannel: VoiceChannel, hidden: boolean) {
        // Check if user has permission to hide or show the channel
        if (!(databaseVoiceChannel.owner === member.id || (databaseVoiceChannel.supervisors && databaseVoiceChannel.supervisors.includes(member.id)))) {
            this.app.logger.debug(`User ${member.id} is not authorized to toggle the visibility of the channel ${databaseVoiceChannel._id}`);
            throw new UnauthorizedError(hidden ? UnauthorizedErrorReason.HideChannel : UnauthorizedErrorReason.ShowChannel);
        }
    }
}