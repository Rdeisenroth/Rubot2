import { BaseCommand } from "@baseCommand";
import { ApplicationCommandOptionType, Colors, EmbedBuilder, GuildMember, VoiceBasedChannel } from "discord.js";
import { DocumentType } from "@typegoose/typegoose";
import { Guild } from "@models/Guild";
import { VoiceChannel } from "@models/VoiceChannel";
import { ChannelNotTemporaryError, CouldNotPermitUserError, NotInVoiceChannelError, UnauthorizedError, UnauthorizedErrorReason, UserNotInGuildError } from "@types";

export default class VoicePermitCommand extends BaseCommand {
    public static name = "permit";
    public static description = "Permits a user to join the voice channel.";
    public static options = [{
        name: "member",
        description: "The member to permit to join the voice channel.",
        type: ApplicationCommandOptionType.User,
        required: true
    }];

    /**
     * The Guild from the Database
     */
    private dbGuild!: DocumentType<Guild>;

    public async execute(): Promise<void> {
        try {
            const memberToPermit = await this.getMemberToPermit();
            this.dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild!);
            const member = this.interaction.member as GuildMember;
            const { voiceChannel, databaseVoiceChannel } = await this.app.roomManager.getTemporaryVoiceChannel(this.dbGuild, member);
            this.checkPermitPermissions(member, databaseVoiceChannel);
            await this.app.roomManager.permitMemberToJoinRoom(memberToPermit, voiceChannel, member);
            await this.addPermittedMemberPrivileges(memberToPermit, databaseVoiceChannel);
            const embed = this.mountVoicePermitEmbed(memberToPermit, voiceChannel);
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

    private mountVoicePermitEmbed(member: GuildMember, voiceChannel: VoiceBasedChannel): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle("User Permitted")
            .setDescription(`User ${member} was permitted to join the voice channel "${voiceChannel}".`)
            .setColor(Colors.Green);
        return embed;
    }

    private mountErrorEmbed(error: Error): EmbedBuilder {
        if (error instanceof NotInVoiceChannelError || error instanceof ChannelNotTemporaryError || error instanceof UnauthorizedError || error instanceof CouldNotPermitUserError || error instanceof UserNotInGuildError) {
            return new EmbedBuilder()
                .setTitle("Error")
                .setDescription(error.message)
                .setColor(Colors.Red);
        }
        throw error;
    }

    private async addPermittedMemberPrivileges(member: GuildMember, databaseVoiceChannel: VoiceChannel): Promise<void> {
        if (!databaseVoiceChannel.permitted.includes(member.id)) {
            databaseVoiceChannel.permitted.push(member.id);
            await this.dbGuild.save();
        }
    }

    private async getMemberToPermit(): Promise<GuildMember> {
        const memberId = this.getOptionValue(VoicePermitCommand.options[0]);
        if (!this.interaction.guild!.members.cache.has(memberId)) {
            throw new UserNotInGuildError();
        }
        return await this.interaction.guild!.members.fetch(memberId);
    }

    private checkPermitPermissions(member: GuildMember, databaseVoiceChannel: VoiceChannel): void {
        // Check if the member has permissions to permit a user to join the voice channel
        if (!(databaseVoiceChannel.owner === member.id || (databaseVoiceChannel.supervisors && databaseVoiceChannel.supervisors.includes(member.id)))) {
            this.app.logger.info(`User ${member.user.tag} tried to permit a user to join the voice channel without permission.`);
            throw new UnauthorizedError(UnauthorizedErrorReason.PermitMember);
        }
    }
}