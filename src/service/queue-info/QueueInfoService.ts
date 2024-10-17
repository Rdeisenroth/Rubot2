import { Guild, GuildChannel, TextChannel, TextChannel as DiscordTextChannel, User } from "discord.js";
import { UserError } from "../error/UserError";
import { QueueEventType } from "../../models/events";
import { ArraySubDocumentType, DocumentType } from "@typegoose/typegoose";
import { Queue } from "../../models/queues";
import { InternalRoles } from "../../models/bot_roles";
import { Session } from "../../models/sessions";
import {QueueService} from "../queue/QueueService";
import {GuildModel, SessionModel} from "../../models/models";

/**
 * A Service to handle all queue info related stuff
 */
export default class QueueInfoService {

    /**
     * broadcasts the given event to all linked queue info channels
     * @param g discord guild
     * @param user user which triggered the event
     * @param queueData db model of the queue
     * @param event queue event to log
     * @param targets target users that were effected by the event
     */
    static async logQueueActivity(g: Guild, user: User, queueData: ArraySubDocumentType<Queue>, event: QueueEventType, targets?: User[]) {
        const guildData = await this.fetchGuildData(g.id);
        const activeSessionRole = guildData.guild_settings.roles?.find(role => role.internal_name === InternalRoles.ACTIVE_SESSION);
        const queueSessions = await SessionModel.find({ queue: queueData._id, active: true });

        for (const infoChannel of queueData.info_channels) {
            if (infoChannel.events.includes(event)) {
                const discordChannel = await g.channels.fetch(infoChannel.channel_id) as TextChannel;
                await discordChannel.send(`<@&${activeSessionRole?.role_id}> ${this.getEventMessage(user, event, queueData, queueSessions, targets)}`);
            }
        }
    }

    /**
     * Sets the given channel as the info channel for the given queue to inform about the given events.
     * @param g discord guild where all magic happens
     * @param queueName name of the queue to the events of
     * @param channel channel to set as queue info channel
     * @param eventStrings events to log
     */
    static async setTextChannelAsQueueInfo(g: Guild, queueName: string, channel: unknown, eventStrings: string[]) {
        this.validateIsTextChannel(channel);

        const guildData = await this.fetchGuildData(g.id);
        const queueData = QueueService.findQueueData(guildData, queueName);

        const events: QueueEventType[] = this.validateAndConvertEventStrings(eventStrings);
        await this.updateQueueInfoChannels(queueData, channel.id, events);
        await guildData.save();
    }

    /**
     * removes the given channel as the info channel for the given queue.
     * @param g discord guild where all magic happens
     * @param queueName name of the queue to the events of
     * @param channel channel to set as queue info channel
     */
    static async removeTextChannelAsQueueInfo(g: Guild, queueName: string, channel: unknown) {
        this.validateIsTextChannel(channel);

        const guildData = await this.fetchGuildData(g.id);
        const queueData = QueueService.findQueueData(guildData, queueName);

        const isRemoved = this.removeChannelFromQueueInfo(queueData, channel.id);

        if (!isRemoved) {
            throw new UserError("This channel is not an info channel for queue: " + queueName);
        }

        await guildData.save();
    }

    /**
     * returns the info channels for the given queue
     * @param user the user that triggered the event
     * @param event the event that was triggered
     * @param queueData the queue data
     * @param queueSessions the queue sessions
     * @returns  the message to send
     */
    private static getEventMessage(user: User, event: QueueEventType, queueData: DocumentType<Queue>, queueSessions: DocumentType<Session>[], targets?: User[]) {
        let msg = "";
        switch (event) {
        case QueueEventType.JOIN:
            msg = `${user.displayName} joined the queue ${queueData.name}.`;
            break;
        case QueueEventType.LEAVE:
            msg = `${user.displayName} left the queue ${queueData.name}`;
            break;
        case QueueEventType.NEXT:
            msg = `${user.displayName} picked ${targets?.length ?? 0} student(s) on queue ${queueData.name}: ${targets?.map(x => x.displayName).join(", ")}`;
            break;
        case QueueEventType.TUTOR_SESSION_START:
            msg = `${user.displayName} started a new session on queue ${queueData.name}`;
            break;
        case QueueEventType.TUTOR_SESSION_QUIT:
            msg = `${user.displayName} quit the session on queue ${queueData.name}`;
            break;
        case QueueEventType.KICK:
            msg = `${targets?.map(x => x.displayName).join(", ")} got kicked from queue ${queueData.name} by ${user.displayName}`;
            break;
        }
        if ([QueueEventType.TUTOR_SESSION_QUIT, QueueEventType.TUTOR_SESSION_START].includes(event)) {
            msg += `\nThis queue now has \`${queueSessions.length}\` active session(s).`;
        } else {
            msg += `\nThere are now \`${queueData.entries.length}\` student(s) in queue ${queueData.name}`;
        }
        return msg;
    }

    /**
     * throws an error if the given channel is not a text channel
     * @param channel the channel to validate
     */
    private static validateIsTextChannel(channel: unknown): asserts channel is DiscordTextChannel {
        if (!channel || !(channel instanceof GuildChannel)) {
            throw new UserError("Channel could not be found.");
        }
        if (!(channel instanceof DiscordTextChannel)) {
            throw new UserError("The channel must be a text channel.");
        }
    }

    /**
     * fetches the guild data from the database
     * @param guildId the id of the guild
     * @returns the guild data
     */
    private static async fetchGuildData(guildId: string) {
        const guildData = await GuildModel.findById(guildId);
        if (!guildData) {
            throw new UserError("Guild Data Could not be found.");
        }
        return guildData;
    }

    /**
     * validates the given event strings and converts them to the enum
     * @param eventStrings the event strings to validate
     * @returns the converted events
     */
    private static validateAndConvertEventStrings(eventStrings: string[]): QueueEventType[] {
        return eventStrings.map(eventString => {
            const eventKey = eventString.toUpperCase();
            if (eventKey in QueueEventType) {
                return QueueEventType[eventKey as keyof typeof QueueEventType];
            }
            throw new UserError(`Invalid event: ${eventString}`);
        });
    }

    /**
     * updates the queue info channels for the given queue
     * 
     * @param queueData the queue data to update
     * @param channelId the channel id to update
     * @param events the events to update
     */
    private static async updateQueueInfoChannels(queueData: ArraySubDocumentType<Queue>, channelId: string, events: QueueEventType[]) {
        const existingIndex = queueData.info_channels.findIndex(info => info.channel_id === channelId);

        if (existingIndex !== -1) {
            queueData.info_channels[existingIndex] = { channel_id: channelId, events };
        } else {
            queueData.info_channels.push({ channel_id: channelId, events });
        }
    }

    /**
     * removes the given channel from the queue info channels
     * @param queueData the queue data to update
     * @param channelId the channel id to remove
     * @returns true if the channel was removed
     */
    private static removeChannelFromQueueInfo(queueData: ArraySubDocumentType<Queue>, channelId: string): boolean {
        const initialLength = queueData.info_channels.length;
        queueData.info_channels = queueData.info_channels.filter(info => info.channel_id !== channelId);
        return initialLength !== queueData.info_channels.length;
    }
}
