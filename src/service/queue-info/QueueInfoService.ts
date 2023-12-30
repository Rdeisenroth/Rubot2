import { Guild as GuildDB, GuildModel } from "../../models/guilds";
import { Guild, GuildChannel, TextChannel, TextChannel as DiscordTextChannel, User } from "discord.js";
import { UserError } from "../error/UserError";
import { QueueEvent } from "./model/QueueEvent";
import { ArraySubDocumentType, DocumentType } from "@typegoose/typegoose";
import { Queue } from "../../models/queues";
import { InternalRoles } from "../../models/bot_roles";

export default class QueueInfoService {

    /**
     * broadcasts the given event to all linked queue info channels
     * @param g discord guild
     * @param user user which triggered the event
     * @param queueData db model of the queue
     * @param event queue event to log
     */
    static async logQueueActivity(g:Guild, user: User, queueData: ArraySubDocumentType<Queue>, event: QueueEvent) {
        const guildData = await this.fetchGuildData(g.id);
        const activeSessionRole = guildData.guild_settings.roles?.find(role => role.internal_name === InternalRoles.ACTIVE_SESSION);

        for (const infoChannel of queueData.info_channels) {
            if (infoChannel.events.includes(event)) {
                const discordChannel = await g.channels.fetch(infoChannel.channel_id) as TextChannel;
                await discordChannel.send(`<@&${activeSessionRole?.role_id}> ${this.getEventMessage(user, event, queueData.name)}`);
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
    static async setTextChannelAsQueueInfo(g: Guild, queueName: string, channel: any, eventStrings: string[]) {
        this.validateChannel(channel);

        const guildData = await this.fetchGuildData(g.id);
        const queueData = this.findQueueData(guildData, queueName);

        const events: QueueEvent[] = this.validateAndConvertEventStrings(eventStrings);
        await this.updateQueueInfoChannels(queueData, channel.id, events);
        await guildData.save();
    }

    /**
     * removes the given channel as the info channel for the given queue.
     * @param g discord guild where all magic happens
     * @param queueName name of the queue to the events of
     * @param channel channel to set as queue info channel
     */
    static async removeTextChannelAsQueueInfo(g: Guild, queueName: string, channel: any) {
        this.validateChannel(channel);

        const guildData = await this.fetchGuildData(g.id);
        const queueData = this.findQueueData(guildData, queueName);

        const isRemoved = this.removeChannelFromQueueInfo(queueData, channel.id);

        if (!isRemoved) {
            throw new UserError("This channel is not an info channel for queue: " + queueName);
        }

        await guildData.save();
    }

    private static getEventMessage(user: User, event: QueueEvent, queueName: string) {
        switch (event) {
        case QueueEvent.JOIN:
            return `${user.displayName} joined the queue`;
        case QueueEvent.LEAVE:
            return `${user.displayName} left the queue`;
        case QueueEvent.NEXT:
            return `${user.displayName} executed queue next`;
        case QueueEvent.TUTOR_SESSION_START:
            return `${user.displayName} started a new session on queue: ${queueName}`;
        case QueueEvent.TUTOR_SESSION_QUIT:
            return `${user.displayName} quit the session on queue: ${queueName}`;
        case QueueEvent.KICK:
            return `${user.displayName} was kicked out of queue: ${queueName}`;
        }
    }


    private static validateChannel(channel: any) {
        if (!channel || !(channel instanceof GuildChannel)) {
            throw new UserError("Channel could not be found.");
        }
        if (!(channel instanceof DiscordTextChannel)) {
            throw new UserError("The channel must be a text channel.");
        }
    }

    private static async fetchGuildData(guildId: string) {
        const guildData = await GuildModel.findById(guildId);
        if (!guildData) {
            throw new UserError("Guild Data Could not be found.");
        }
        return guildData;
    }

    private static findQueueData(guildData: DocumentType<GuildDB>, queueName: string) {
        const queueData = guildData.queues.find(x => x.name === queueName);
        if (!queueData) {
            throw new UserError("Could not find Queue.");
        }
        return queueData;
    }

    private static validateAndConvertEventStrings(eventStrings: string[]): QueueEvent[] {
        return eventStrings.map(eventString => {
            const eventKey = eventString.toUpperCase();
            if (eventKey in QueueEvent) {
                return QueueEvent[eventKey as keyof typeof QueueEvent];
            }
            throw new UserError(`Invalid event: ${eventString}`);
        });
    }

    private static async updateQueueInfoChannels(queueData: ArraySubDocumentType<Queue>, channelId: string, events: QueueEvent[]) {
        const existingIndex = queueData.info_channels.findIndex(info => info.channel_id === channelId);

        if (existingIndex !== -1) {
            queueData.info_channels[existingIndex] = { channel_id: channelId, events };
        } else {
            queueData.info_channels.push({ channel_id: channelId, events });
        }
    }

    private static removeChannelFromQueueInfo(queueData: ArraySubDocumentType<Queue>, channelId: string): boolean {
        const initialLength = queueData.info_channels.length;
        queueData.info_channels = queueData.info_channels.filter(info => info.channel_id !== channelId);
        return initialLength !== queueData.info_channels.length;
    }
}