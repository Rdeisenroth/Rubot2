import { BaseCommand } from "@baseCommand";
import { Guild } from "@models/Guild";
import { ApplicationCommandOptionType, Colors, EmbedBuilder, GuildMember } from "discord.js";
import { DocumentType } from "@typegoose/typegoose";
import { CanNotTransferToYourselfError, ChannelNotTemporaryError, NotInVoiceChannelError, UnauthorizedError, UnauthorizedErrorReason, UserNotInGuildError } from "@types";
import { VoiceChannel } from "@models/VoiceChannel";

export default class VoiceTransferCommand extends BaseCommand {
    public static name = "transfer";
    public static description = "Transfers the ownership of the voice channel to another user.";
    public static options = [{
        name: "member",
        description: "The member to transfer the ownership to.",
        type: ApplicationCommandOptionType.User,
        required: true
    }];


    /**
     * The Guild from the Database
     */
    private dbGuild!: DocumentType<Guild>;

    public async execute(): Promise<void> {
        try {
            const memberToTransfer = await this.getMemberToTransfer();
            this.dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild!);
            const member = this.interaction.member as GuildMember;
            const { voiceChannel, databaseVoiceChannel } = await this.app.roomManager.getTemporaryVoiceChannel(this.dbGuild, member);
            this.checkTransferPermissions(this.interaction.member as GuildMember, memberToTransfer, databaseVoiceChannel);
            await this.app.roomManager.transferRoomOwnership(this.dbGuild, memberToTransfer, voiceChannel, databaseVoiceChannel, member);
            const embed = this.mountVoiceTransferEmbed(memberToTransfer);
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

    private mountVoiceTransferEmbed(member: GuildMember): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle("Ownership Transferred")
            .setDescription(`The ownership of the voice channel was transferred to ${member}.`)
            .setColor(Colors.Green);
        return embed;
    }

    private mountErrorEmbed(error: Error): EmbedBuilder {
        if (error instanceof NotInVoiceChannelError || error instanceof ChannelNotTemporaryError || error instanceof CanNotTransferToYourselfError || error instanceof UnauthorizedError || error instanceof UserNotInGuildError) {
            return new EmbedBuilder()
                .setTitle("Error")
                .setDescription(error.message)
                .setColor(Colors.Red);
        }
        throw error;
    }

    private async getMemberToTransfer(): Promise<GuildMember> {
        const memberId = this.getOptionValue(VoiceTransferCommand.options[0]);
        if (!this.interaction.guild!.members.cache.has(memberId)) {
            throw new UserNotInGuildError();
        }
        return await this.interaction.guild!.members.fetch(memberId);
    }

    private checkTransferPermissions(member: GuildMember, memberToTransfer: GuildMember, databaseVoiceChannel: VoiceChannel): void {
        // Check if user has permission to transfer the room
        if (!(databaseVoiceChannel.owner === member.id)) {
            this.app.logger.info(`User ${member.id} tried to transfer the room ${databaseVoiceChannel._id} but is not the owner.`);
            throw new UnauthorizedError(UnauthorizedErrorReason.TransferChannel);
        }

        // Check if the member to transfer is the same as the member
        if (member.id === memberToTransfer.id) {
            throw new CanNotTransferToYourselfError(); 
        }
    }
}