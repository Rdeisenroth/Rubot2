import { BaseEvent } from "@baseEvent"
import { InternalRoles } from "@models/BotRoles";
import { VoiceChannelEventType } from "@models/Event";
import { RoomModel } from "@models/Models";
import { Guild as DatabaseGuild } from "@models/Guild";
import { VoiceChannel } from "@models/VoiceChannel";
import { GuildMember, VoiceBasedChannel, VoiceState } from "discord.js";
import { ArraySubDocumentType, DocumentType } from "@typegoose/typegoose";
import assert from "assert";
import { Room } from "@models/Room";

export default class VoiceChannelUpdateEvent extends BaseEvent {
    public static name = "voiceStateUpdate";

    private dbGuild!: DocumentType<DatabaseGuild>;

    public async execute(oldState: VoiceState, newState: VoiceState) {
        this.app.logger.info(`Voice state updated for user ${newState.member?.user.tag} (id: ${newState.member?.id}) in guild ${newState.guild.name} (id: ${newState.guild.id})`);
        this.handleVoiceStateUpdate(oldState, newState);
    }

    private async handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<void> {
        const oldUserChannel = oldState.channel;
        const newUserChannel = newState.channel;

        if (newUserChannel && newUserChannel.guild && newUserChannel.id != oldUserChannel?.id) {
            await this.handleVoiceJoin(newState)
        } else if (oldUserChannel && oldUserChannel.guild && oldUserChannel.id != newUserChannel?.id) {
            await this.handleVoiceLeave(oldState)
        }
    }

    private async handleVoiceJoin(newState: VoiceState): Promise<void> {
        const newUserChannel = newState.channel!;
        this.app.logger.info(`User ${newState.member?.user.tag} (id: ${newState.member?.id}) joined voice channel ${newUserChannel.name} (id: ${newUserChannel.id}) in guild ${newState.guild.name} (id: ${newState.guild.id})`);

        this.dbGuild = await this.app.configManager.getGuildConfig(newState.guild);
        const dbChannel = this.dbGuild.voice_channels.find(channel => channel.id === newUserChannel.id)

        if (dbChannel && dbChannel.queue) {
            await this.handleQueueJoin(newUserChannel, dbChannel, newState.member!);
            return
        }

        const dbRoom = await RoomModel.findById(newUserChannel.id);
        if (dbRoom) {
            await this.handleRoomEvent(newUserChannel, dbRoom, newState.member!, VoiceChannelEventType.user_join);
        }
    }

    private async handleQueueJoin(userChannel: VoiceBasedChannel, dbChannel: ArraySubDocumentType<VoiceChannel>, member: GuildMember): Promise<void> {
        assert(dbChannel.queue, "Queue is not defined in voice channel");

        const queue = this.app.queueManager.getQueueById(this.dbGuild, dbChannel.queue._id);

        if (!queue) {
            this.app.logger.error(`Could not find queue ${dbChannel.queue.id} referenced by channel ${userChannel.name} (id: ${userChannel.id}) in guild ${this.dbGuild.name} (id: ${this.dbGuild.id})`);
            return
        }

        try {
            if (queue.contains(member!.id)) {
                this.app.queueManager.stayInQueue(queue, member.user);
                this.app.dmManager.sendQueueStayMessage(member.user, queue);
                return
            }

            if (this.memberIsTutor(member)) {
                this.app.logger.info(`User ${member.user.tag} (id: ${member.id}) is a tutor in guild ${this.dbGuild.name} (id: ${this.dbGuild.id}). Not adding to queue.`);
                return
            }

            if (queue.locked && !queue.contains(member.id)) {
                await member.voice.setChannel(null);
                this.app.dmManager.sendQueueLockedMessage(member.user, queue);
            }

            const joinMessage = await this.app.queueManager.joinQueue(queue, member.user);
            this.app.dmManager.sendQueueJoinMessage(member.user, queue, joinMessage);
        } catch (error) {
            if (error instanceof Error) {
                this.app.logger.error(`Could not add user ${member.user.tag} (id: ${member.id}) to queue ${queue.name} (id: ${dbChannel.queue.id}) in guild ${this.dbGuild.name} (id: ${this.dbGuild.id}). Error: ${error}`);
                this.app.dmManager.sendErrorMessage(member.user, error);
                return
            } 
            this.app.logger.error(`Could not add user ${member.user.tag} (id: ${member.id}) to queue ${queue.name} (id: ${dbChannel.queue.id}) in guild ${this.dbGuild.name} (id: ${this.dbGuild.id}). Error: ${error}`);
            this.app.dmManager.sendErrorMessage(member.user, new Error("An unknown error occurred while adding you to the queue. Please try again later."));
            return
        }
    }


    private async handleVoiceLeave(oldState: VoiceState): Promise<void> {
        const oldUserChannel = oldState.channel!;
        this.app.logger.info(`User ${oldState.member?.user.tag} (id: ${oldState.member?.id}) left voice channel ${oldUserChannel.name} (id: ${oldUserChannel.id}) in guild ${oldState.guild.name} (id: ${oldState.guild.id})`);

        this.dbGuild = await this.app.configManager.getGuildConfig(oldState.guild);
        const dbChannel = this.dbGuild.voice_channels.find(channel => channel.id === oldUserChannel.id)

        if (dbChannel && dbChannel.temporary && oldUserChannel.members.size === 0) {
            await this.removeTemporaryChannel(oldUserChannel, dbChannel);
            return
        } else if (dbChannel && dbChannel.queue) {
            await this.handleQueueLeave(oldUserChannel, dbChannel, oldState.member!);
            return
        }

        const dbRoom = await RoomModel.findById(oldUserChannel.id);
        if (dbRoom) {
            await this.handleRoomEvent(oldUserChannel, dbRoom, oldState.member!, VoiceChannelEventType.user_leave);
        }
    }

    private async removeTemporaryChannel(channel: VoiceBasedChannel, dbChannel: ArraySubDocumentType<VoiceChannel>): Promise<void> {
        if (channel.deletable) {
            await channel.delete();
            this.app.logger.info(`Removed temporary channel ${channel.name} (id: ${channel.id}) in guild ${channel.guild.name} (id: ${channel.guild.id})`);
        } else {
            this.app.logger.error(`Could not remove temporary channel ${channel.name} (id: ${channel.id}) in guild ${channel.guild.name} (id: ${channel.guild.id})`);
        }
    }

    private async handleQueueLeave(userChannel: VoiceBasedChannel, dbChannel: ArraySubDocumentType<VoiceChannel>, member: GuildMember): Promise<void> {
        assert(dbChannel.queue, "Queue is not defined in voice channel");

        const queue = this.app.queueManager.getQueueById(this.dbGuild, dbChannel.queue._id);

        if (!queue) {
            this.app.logger.error(`Could not find queue ${dbChannel.queue.id} referenced by channel ${userChannel.name} (id: ${userChannel.id}) in guild ${this.dbGuild.name} (id: ${this.dbGuild.id})`);
            return
        }

        if (queue.contains(member.id)) {
            if (queue.disconnect_timeout) {
                const leaveMessage = await this.app.queueManager.leaveQueueWithTimeout(this.dbGuild, member.user);
                this.app.dmManager.sendActuallyLeaveQueueMessage(member.user, queue, leaveMessage);
            } else {
                const leaveMessage = await this.app.queueManager.leaveQueue(this.dbGuild, member.user);
                this.app.dmManager.sendQueueLeaveMessage(member.user, queue, leaveMessage);
            }
        }
    }

    private async handleRoomEvent(userChannel: VoiceBasedChannel, dbRoom: DocumentType<Room>, member: GuildMember, event: VoiceChannelEventType): Promise<void> {
        dbRoom.events.push({
            emitted_by: member.id,
            type: event,
            timestamp: Date.now().toString()
        });
        await dbRoom.save();
        this.app.logger.info(`User ${member.user.tag} (id: ${member.id}) joined room ${userChannel.name} (id: ${userChannel.id}) in guild ${member.guild.name} (id: ${member.guild.id})`);
    }

    private memberIsTutor(member: GuildMember): boolean {
        const dbTutorRole = this.dbGuild.guild_settings.roles?.find(role => role.internal_name = InternalRoles.TUTOR);
        if (dbTutorRole) {
            return member.roles.cache.some(role => role.id === dbTutorRole.id);
        }
        return false
    }
}