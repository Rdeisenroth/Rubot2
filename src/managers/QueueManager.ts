import { delay, inject, injectable, singleton } from "tsyringe";
import { Application } from "@application";
import { Queue } from "@models/Queue";
import { DocumentType, mongoose } from "@typegoose/typegoose";
import { AlreadyInQueueError, ChannelAlreadyInfoChannelError, ChannelNotInfoChannelError, CouldNotFindQueueError, InvalidEventError, NotInQueueError, QueueAlreadyExistsError, QueueLockedError } from "@types";
import { Guild as DatabaseGuild } from "@models/Guild";
import { QueueEntryModel } from "@models/QueueEntry";
import { EmbedBuilder, TextChannel, User, Guild as DiscordGuild } from "discord.js";
import { FilterOutFunctionKeys } from "@typegoose/typegoose/lib/types";
import { QueueEventType } from "@models/Event";
import { Session } from "inspector";
import { InternalRoles } from "@models/BotRoles";
import { SessionModel } from "@models/Session";

@injectable()
@singleton()
export default class QueueManager {
    protected app: Application;

    constructor(@inject(delay(() => Application)) app: Application) {
        this.app = app;
    }

    /**
     * Creates a new queue for a guild.
     * 
     * @param dbGuild - The database guild object.
     * @param queueName - The name of the queue.
     * @param queueDescription - The description of the queue.
     * @throws {QueueAlreadyExistsError} If a queue with the same name already exists in the guild.
     */
    public async createQueue(dbGuild: DocumentType<DatabaseGuild>, queueName: string, queueDescription: string): Promise<void> {
        if (dbGuild.queues.some(queue => queue.name === queueName)) {
            this.app.logger.info(`Queue with name ${queueName} already exists in guild ${dbGuild.name} (id: ${dbGuild._id})`);
            throw new QueueAlreadyExistsError(queueName);
        }
        const queue: FilterOutFunctionKeys<Queue> = {
            name: queueName,
            description: queueDescription,
            disconnect_timeout: 60000,
            match_timeout: 120000,
            limit: 150,
            join_message: "You joined the ${name} queue.\n\\> Your Position: ${pos}/${total}",
            match_found_message: "You have found a Match with ${match}. Please Join ${match_channel} if you are not moved automatically. If you don't join in ${timeout} seconds, your position in the queue is dropped.",
            timeout_message: "Your queue Timed out after ${timeout} seconds.",
            leave_message: "You Left the `${name}` queue.\nTotal Time Spent: ${time_spent}",
            entries: new mongoose.Types.DocumentArray([]),
            opening_times: new mongoose.Types.DocumentArray([]),
            info_channels: [],
        }
        this.app.logger.debug(`Creating queue "${queueName}" on guild "${dbGuild.name}" (id: ${dbGuild._id})`)
        dbGuild.queues.push(queue);
        await dbGuild.save();
        this.app.logger.info(`Queue "${queueName}" created on guild "${dbGuild.name}" (id: ${dbGuild._id})`)
    }

    /**
     * Retrieves a queue from the specified guild's database. The comparison is case-insensitive.
     * 
     * @param dbGuild - The database guild object.
     * @param queueName - The name of the queue to retrieve.
     * @returns The retrieved queue.
     * @throws {CouldNotFindQueueError} if the specified queue cannot be found.
     */
    public getQueue(dbGuild: DatabaseGuild, queueName: string): DocumentType<Queue> {
        const queue = dbGuild.queues.find(queue => queue.name.toLowerCase() === queueName.toLowerCase());
        if (!queue) {
            this.app.logger.debug(`Queue "${queueName}" not found in guild "${dbGuild.name}" (id: ${dbGuild._id})`);
            throw new CouldNotFindQueueError(queueName);
        }
        this.app.logger.debug(`Queue "${queueName}" found in guild "${dbGuild.name}" (id: ${dbGuild._id})`);
        return queue;
    }

    /**
     * Retrieves the queue associated with a specific user.
     * 
     * @param dbGuild - The database guild object.
     * @param userId - The ID of the user.
     * @returns The Queue object associated with the user, or undefined if not found.
     */
    public getQueueOfUser(dbGuild: DatabaseGuild, user: User): DocumentType<Queue> | undefined {
        this.app.logger.debug(`Retrieving queue of user "${user.username}" (id: ${user.id}) in guild "${dbGuild.name}" (id: ${dbGuild._id})`);
        return dbGuild.queues.find(queue => queue.contains(user.id));
    }

    /**
     * Adds a user to the specified queue.
     * 
     * @param queue - The queue to join.
     * @param userId - The ID of the user to add to the queue.
     * @param intent - The intent of the user joining the queue.
     * @returns A promise that resolves to a string representing the join message.
     * @throws {AlreadyInQueueError} If the user is already in the queue.
     * @throws {QueueLockedError} If the queue is locked.
     */
    public async joinQueue(queue: DocumentType<Queue>, user: User, intent: string): Promise<string> {
        // Check if the user is already in the queue they are trying to join.
        if (queue.contains(user.id)) {
            this.app.logger.info(`User "${user.username}" (id: ${user.id}) tried to join queue "${queue.name}" but is already in it`);
            throw new AlreadyInQueueError(queue.name);
        }

        // Check if the queue is locked.
        if (queue.locked) {
            this.app.logger.info(`User "${user.username}" (id: ${user.id}) tried to join queue "${queue.name}" but it is locked`);
            throw new QueueLockedError(queue.name);
        }

        // Add the user to the queue.
        const newEntry = new QueueEntryModel({
            discord_id: user.id,
            joinedAt: Date.now().toString(),
            importance: 1,
            intent: intent,
        });
        queue.entries.push(newEntry);
        await queue.$parent()?.save();
        this.app.logger.info(`User "${user.username}" (id: ${user.id}) joined queue "${queue.name}"`);

        this.logQueueActivity(queue, QueueEventType.JOIN, user);
        // Return the join message.
        return queue.getJoinMessage(user.id);
    }

    /**
     * Removes a user from the queue he is in and returns the leave message.
     *
     * @param guild - The database guild.
     * @param user - The user to remove from the queue.
     * @returns The leave message.
     * @throws {NotInQueueError} If the user is not in a queue.
     */
    public async leaveQueue(guild: DatabaseGuild, user: User): Promise<string> {
        const queue = this.getQueueOfUser(guild, user);
        if (!queue) {
            this.app.logger.info(`User "${user.username}" (id: ${user.id}) tried to leave queue but is not in a queue`);
            throw new NotInQueueError();
        }

        const leaveMessage = queue.getLeaveMessage(user.id);

        // remove the user from the queue
        const userIndex = queue.entries.findIndex(entry => entry.discord_id === user.id)
        queue.entries.splice(userIndex, 1)
        await queue.$parent()?.save()
        this.app.logger.info(`User "${user.username}" (id: ${user.id}) left queue "${queue.name}"`);

        this.logQueueActivity(queue, QueueEventType.LEAVE, user);
        return leaveMessage;
    }

    /**
     * Adds a queue info channel to the specified database guild.
     * 
     * @param dbGuild - The database guild to add the queue info channel to.
     * @param queueName - The name of the queue.
     * @param channel - The text channel to set as the info channel.
     * @param eventStrings - An array of event strings.
     * @throws {ChannelAlreadyInfoChannelError} If the channel is already an info channel for the queue.
     * @throws {InvalidEventError} If an invalid event string is encountered.
     * @throws {CouldNotFindQueueError} If the specified queue cannot be found.
     */
    public async addQueueInfoChannel(dbGuild: DocumentType<DatabaseGuild>, queueName: string, channel: TextChannel, eventStrings: string[]): Promise<void> {
        const queue = this.getQueue(dbGuild, queueName);
        const events = this.validateAndConvertEventStrings(eventStrings);

        // Check if the channel is already an info channel for the queue
        if (queue.info_channels.some(infoChannel => infoChannel.channel_id === channel.id)) {
            this.app.logger.debug(`Channel "${channel.name}" (id: ${channel.id}) is already an info channel for queue "${queue.name}"`);
            throw new ChannelAlreadyInfoChannelError(queue.name, channel.name ?? channel.id);
        }

        // Add the channel to the queue info channels
        queue.info_channels.push({ channel_id: channel.id, events: events });
        await dbGuild.save();
        this.app.logger.info(`Channel "${channel.name}" (id: ${channel.id}) set as info channel for queue "${queue.name}"`);
    }

    /**
     * Validates and converts an array of event strings to an array of QueueEventType.
     * 
     * @param eventStrings - The array of event strings to validate and convert.
     * @returns An array of QueueEventType.
     * @throws {InvalidEventError} If an invalid event string is encountered.
     */
    private validateAndConvertEventStrings(eventStrings: string[]): QueueEventType[] {
        return eventStrings.map(eventString => {
            const eventKey = eventString.toUpperCase();
            if (eventKey in QueueEventType) {
                return QueueEventType[eventKey as keyof typeof QueueEventType];
            }
            this.app.logger.info(`Invalid event: "${eventString}"`);
            throw new InvalidEventError(eventString, Object.values(QueueEventType));
        });
    }

    /**
     * Removes a queue info channel from the specified database guild.
     * 
     * @param dbGuild - The database guild to remove the queue info channel from.
     * @param queueName - The name of the queue.
     * @param channel - The text channel to remove from the info channels.
     * @throws {ChannelNotInfoChannelError} If the channel is not an info channel for the queue.
     * @throws {CouldNotFindQueueError} If the specified queue cannot be found.
     */
    public async removeQueueInfoChannel(dbGuild: DocumentType<DatabaseGuild>, queueName: string, channel: TextChannel): Promise<void> {
        const queue = this.getQueue(dbGuild, queueName);
        const channelIndex = queue.info_channels.findIndex(infoChannel => infoChannel.channel_id === channel.id);

        // Check if the channel is an info channel for the queue
        if (channelIndex === -1) {
            this.app.logger.debug(`Channel "${channel.name}" (id: ${channel.id}) is not an info channel for queue "${queue.name}"`);
            throw new ChannelNotInfoChannelError(queue.name, channel.name ?? channel.id);
        }

        // Remove the channel from the queue info channels
        queue.info_channels.splice(channelIndex, 1);
        await dbGuild.save();
        this.app.logger.info(`Channel "${channel.name}" (id: ${channel.id}) removed from info channels for queue "${queue.name}"`);
    }


    /**
     * Logs the activity of a queue.
     * 
     * @param queue - The queue on which the activity occurred.
     * @param event - The type of queue event.
     * @param user - The user associated with the event.
     * @param targets - Optional array of users to target with the event.
     * @returns A promise that resolves when the activity is logged.
     */
    private async logQueueActivity(queue: DocumentType<Queue>, event: QueueEventType, user: User, targets?: User[]): Promise<void> {
        const dbGuild = queue.$parent() as DocumentType<DatabaseGuild>;
        const activeSessionRole = dbGuild.guild_settings.roles?.find(role => role.internal_name === InternalRoles.ACTIVE_SESSION);
        const queueSessions: DocumentType<Session>[] = await SessionModel.find({ queue: queue._id, active: true });

        for (const infoChannel of queue.info_channels) {
            if (infoChannel.events.includes(event)) {
                const discordChannel = this.app.client.channels.cache.get(infoChannel.channel_id)! as TextChannel;
                if (!discordChannel) {
                    this.app.logger.debug(`Channel with id ${infoChannel.channel_id} not found in guild ${dbGuild.name} (id: ${dbGuild._id})`);
                    continue;
                }
                const emebed = this.getEventEmbed(user, event, queue, queueSessions, targets);
                const message = await discordChannel.send(`<@&${activeSessionRole?.role_id}>`);
                await message.edit({ embeds: [emebed] });
            }
        }
    }

    /**
     * Generates an embed message for a queue event.
     * 
     * @param user - The user associated with the event.
     * @param event - The type of queue event.
     * @param queue - The queue on which the event occurred.
     * @param sessions - The array of active sessions.
     * @param targets - Optional. The array of users affected by the event.
     * @returns The generated EmbedBuilder object.
     */
    private getEventEmbed(user: User, event: QueueEventType, queue: DocumentType<Queue>, sessions: DocumentType<Session>[], targets?: User[]): EmbedBuilder {
        let eventDescription: string = "";
        switch (event) {
            case QueueEventType.JOIN:
                eventDescription = `${user} joined the queue ${queue.name}.`;
                break;
            case QueueEventType.LEAVE:
                eventDescription = `${user} left the queue ${queue.name}.`;
                break;
            case QueueEventType.NEXT:
                eventDescription = `${user} picked ${targets?.join(", ")} from the queue ${queue.name}.`;
                break;
            case QueueEventType.TUTOR_SESSION_START:
                eventDescription = `${user} started a new tutor session on the queue ${queue.name}.`;
                break;
            case QueueEventType.TUTOR_SESSION_QUIT:
                eventDescription = `${user} ended the tutor session on the queue ${queue.name}.`;
                break;
            case QueueEventType.KICK:
                eventDescription = `${targets?.join(", ")} were kicked from the queue ${queue.name} by ${user}.`;
                break;
        }
        let sessionsDescription = `There ${sessions.length === 1 ? "is" : "are"} ${sessions.length} active session${sessions.length === 1 ? "" : "s"} in the queue ${queue.name}.`;
        let membersDescription = `There ${queue.entries.length === 1 ? "is" : "are"} ${queue.entries.length} member${queue.entries.length === 1 ? "" : "s"} in the queue ${queue.name}.`;

        return new EmbedBuilder()
            .setTitle("Queue Activity")
            .addFields(
                { name: "❯ Event", value: eventDescription },
                { name: "❯ Active Sessions", value: sessionsDescription },
                { name: "❯ Members", value: membersDescription },
            )
    }
}