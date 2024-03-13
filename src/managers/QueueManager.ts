import { delay, inject, injectable, singleton } from "tsyringe";
import { Application } from "@application";
import { Queue } from "@models/Queue";
import { DocumentType, mongoose } from "@typegoose/typegoose";
import { AlreadyInQueueError, CouldNotFindQueueError, NotInQueueError, QueueAlreadyExistsError, QueueLockedError } from "@types";
import { Guild as DatabaseGuild } from "@models/Guild";
import { QueueEntry, QueueEntryModel } from "@models/QueueEntry";
import { User } from "discord.js";
import { FilterOutFunctionKeys } from "@typegoose/typegoose/lib/types";

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
            this.app.logger.debug(`Queue ${queueName} not found in guild ${dbGuild.name} (id: ${dbGuild._id})`);
            throw new CouldNotFindQueueError(queueName);
        }
        this.app.logger.debug(`Queue ${queueName} found in guild ${dbGuild.name} (id: ${dbGuild._id})`);
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
        this.app.logger.debug(`Retrieving queue of user ${user.username} (id: ${user.id}) in guild ${dbGuild.name} (id: ${dbGuild._id})`);
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
            this.app.logger.info(`User ${user.username} (id: ${user.id}) tried to join queue ${queue.name} but is already in it`);
            throw new AlreadyInQueueError(queue.name);
        }

        // Check if the queue is locked.
        if (queue.locked) {
            this.app.logger.info(`User ${user.username} (id: ${user.id}) tried to join queue ${queue.name} but it is locked`);
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
        this.app.logger.info(`User ${user.username} (id: ${user.id}) joined queue ${queue.name}`);

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
            this.app.logger.info(`User ${user.username} (id: ${user.id}) tried to leave queue but is not in a queue`);
            throw new NotInQueueError();
        }

        const leaveMessage = queue.getLeaveMessage(user.id);

        // remove the user from the queue
        const userIndex = queue.entries.findIndex(entry => entry.discord_id === user.id)
        queue.entries.splice(userIndex, 1)
        await queue.$parent()?.save()
        this.app.logger.info(`User ${user.username} (id: ${user.id}) left queue ${queue.name}`);

        return leaveMessage;
    }


}