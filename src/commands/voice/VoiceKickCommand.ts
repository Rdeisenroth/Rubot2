import { BaseCommand } from "@baseCommand";
import { Guild } from "@models/Guild";
import { VoiceChannel } from "@models/VoiceChannel";
import { NotInVoiceChannelError, ChannelNotTemporaryError, UnauthorizedError, UnauthorizedErrorReason, CouldNotKickUserError } from "@types";
import { ApplicationCommandOptionType, Colors, EmbedBuilder, GuildMember, VoiceBasedChannel } from "discord.js";
import { DocumentType } from "@typegoose/typegoose";

export default class VoiceKickCommand extends BaseCommand {
    public static name = "kick";
    public static description = "Kicks a user from the voice channel.";
    public static options = [{
        name: "member",
        description: "The member to kick from the voice channel.",
        type: ApplicationCommandOptionType.User,
        required: true
    }];

    /**
     * The Guild from the Database
     */
    private dbGuild!: DocumentType<Guild>;

    public async execute(): Promise<void> {
        try {
            const memberToKick = await this.getMemberToKick();
            this.dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild!);
            const member = this.interaction.member as GuildMember;
            const { voiceChannel, databaseVoiceChannel } = await this.app.roomManager.getTemporaryVoiceChannel(this.dbGuild, member);
            this.checkKickPermissions(member, memberToKick, databaseVoiceChannel);
            await this.app.roomManager.kickMemberFromRoom(memberToKick, voiceChannel, this.interaction.member as GuildMember);
            await this.removeKickedMemberPrivileges(memberToKick, voiceChannel, databaseVoiceChannel);
            const embed = this.mountVoiceKickEmbed(memberToKick);
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

    private mountVoiceKickEmbed(member: GuildMember): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle("User Kicked")
            .setDescription(`User ${member} was kicked from the voice channel.`)
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

    private async removeKickedMemberPrivileges(member: GuildMember, voiceChannel: VoiceBasedChannel, databaseVoiceChannel: VoiceChannel): Promise<void> {
        // Change permitted users in database
        if (databaseVoiceChannel.permitted.includes(member.id)) {
            databaseVoiceChannel.permitted.splice(databaseVoiceChannel.permitted.indexOf(member.id), 1);
            await this.dbGuild.save();
        }

        // Remove user from permission overwrites
        await voiceChannel.permissionOverwrites.delete(member.id);
    }

    private async getMemberToKick(): Promise<GuildMember> {
        const memberId = this.getOptionValue(VoiceKickCommand.options[0]);
        return await this.interaction.guild?.members.fetch(memberId)!;
    }

    private checkKickPermissions(member: GuildMember, memberToKick: GuildMember, databaseVoiceChannel: VoiceChannel): void {
        // Check if user has permission to kick the member
        if (!(databaseVoiceChannel.owner === member.id || (databaseVoiceChannel.supervisors && databaseVoiceChannel.supervisors.includes(member.id)))) {
            this.app.logger.info("User is not authorized to kick a member from the channel.");
            throw new UnauthorizedError(UnauthorizedErrorReason.KickMember);
        }

        // Check if user is trying to kick the owner of the channel
        if (memberToKick.id === databaseVoiceChannel.owner) {
            this.app.logger.info("User is trying to kick the owner of the channel.");
            throw new UnauthorizedError(UnauthorizedErrorReason.KickOwner);
        }
    }
}