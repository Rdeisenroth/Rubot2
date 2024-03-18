import { BaseCommand } from "@baseCommand";
import { Queue } from "@models/Queue";
import { CouldNotFindChannelError, CouldNotFindQueueError, CouldNotFindRoleError, InteractionNotInGuildError, RoleNotInDatabaseError } from "@types";
import { Guild as DatabaseGuild } from "@models/Guild";
import { ArraySubDocumentType, DocumentType, mongoose } from "@typegoose/typegoose";
import { ApplicationCommandOptionType, ChannelType, Colors, EmbedBuilder, Role, VoiceChannel } from "discord.js";
import { VoiceChannelModel } from "@models/Models";

export default class SetWaitingRoomCommand extends BaseCommand {
    public static name = "set_waiting_room";
    public static description = "Sets or overwrites the waiting room for the queue.";
    public static options = [
        {
            name: "channel",
            description: "The voice channel to be set as the waiting room.",
            type: ApplicationCommandOptionType.Channel,
            required: true,
        },
        {
            name: "queue",
            description: "The queue for which the waiting room will be set.",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "supervisor",
            description: "The role that will be able to supervise the waiting room.",
            type: ApplicationCommandOptionType.Role,
            required: true,
        },
    ];

    /**
     * The guild saved in the database.
     */
    private dbGuild!: DocumentType<DatabaseGuild>;

    public async execute() {
        await this.defer();
        if (!this.interaction.guild) {
            throw new InteractionNotInGuildError(this.interaction);
        }
        this.dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild)
        try {
            const { channel, queue, supervisor } = this.getOptionValues();
            await this.createWaitingRoom(channel, queue, supervisor);

            const embed = this.mountSetWaitingRoomEmbed(channel, queue, supervisor);
            await this.send({ embeds: [embed] });
        } catch (error) {
            if (error instanceof CouldNotFindChannelError || error instanceof CouldNotFindQueueError || error instanceof CouldNotFindRoleError || error instanceof RoleNotInDatabaseError) {
                const embed = this.mountSetWaitingRoomFailedEmbed(error);
                await this.send({ embeds: [embed] });
                return;
            }
            throw error;
        }
    }

    private mountSetWaitingRoomEmbed(channel: VoiceChannel, queue: DocumentType<Queue>, supervisor: Role): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle("Waiting Room Set")
            .setDescription(`:white_check_mark: Waiting room ${channel} set for queue "${queue.name}".`)
            .setColor(Colors.Green)
        return embed
    }

    private mountSetWaitingRoomFailedEmbed(error: CouldNotFindChannelError | CouldNotFindQueueError | CouldNotFindRoleError | RoleNotInDatabaseError): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle("Could Not Set Waiting Room")
            .setColor(Colors.Red)
        if (error instanceof RoleNotInDatabaseError) {
            embed.setDescription(`:x: Role ${error.role} is not an internal role. Try running \`/admin update_bot_roles\` to update the internal roles.`)
        } else {
            embed.setDescription(`:x: ${error.message}`)
        }
        return embed
    }

    private async createWaitingRoom(channel: VoiceChannel, queue: DocumentType<Queue>, supervisor: Role): Promise<void> {
        const existingWaitingRoom = this.dbGuild.voice_channels.find(voiceChannel => voiceChannel.queue == queue.id)
        if (existingWaitingRoom) {
            this.app.logger.debug(`Found existing waiting room for queue ${queue.name}. Overwriting.`)
            existingWaitingRoom._id = channel.id;
            existingWaitingRoom.supervisors = new mongoose.Types.DocumentArray([supervisor.id as any]);
            await this.dbGuild.save();
            return;
        } else {
            this.app.logger.debug(`Creating new waiting room for queue ${queue.name}.`)
            const waitingRoomChannel = new VoiceChannelModel({
                _id: channel.id,
                channel_type: channel.type,
                locked: false,
                managed: true,
                permitted: [],
                queue: queue.id,
                supervisors: [supervisor.id],
            });
            this.dbGuild.voice_channels.push(waitingRoomChannel);
            await this.dbGuild.save();
        }
    }

    private getOptionValues(): { channel: VoiceChannel, queue: DocumentType<Queue>, supervisor: Role } {
        const channelId = this.getOptionValue(SetWaitingRoomCommand.options[0]);
        const channel = this.getVoiceChannel(channelId);
        const queueName = this.getOptionValue(SetWaitingRoomCommand.options[1]);
        const queue = this.app.queueManager.getQueue(this.dbGuild, queueName);
        const supervisorId = this.getOptionValue(SetWaitingRoomCommand.options[2]);
        const supervisor = this.getRole(supervisorId);
        return { channel, queue, supervisor };
    }

    private getVoiceChannel(channelId: string): VoiceChannel {
        const channel = this.interaction.guild?.channels.cache.get(channelId);
        if (!channel || channel.type != ChannelType.GuildVoice) {
            const error = new CouldNotFindChannelError(channel?.name ?? channelId, ChannelType.GuildVoice);
            this.app.logger.debug(error.message);
            throw error;
        }
        return channel;
    }

    private getRole(roleId: string): Role {
        const role = this.interaction.guild?.roles.cache.get(roleId);
        if (!role) {
            const error = new CouldNotFindRoleError(roleId);
            this.app.logger.debug(error.message);
            throw error;
        }
        const roleInDatabase = this.dbGuild.guild_settings.roles?.find(x => x.role_id === roleId);
        if (!roleInDatabase) {
            const error = new RoleNotInDatabaseError(role);
            this.app.logger.debug(error.message);
            throw error;
        }
        return role;
    }
}