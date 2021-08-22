import mongoose from "mongoose";
import { GuildDocument } from "./guilds";
import QueueEntrySchema, { QueueEntry } from "./queue_entry";
import VoiceChannelSpawnerSchema, { VoiceChannelSpawner } from "./voice_channel_spawner";

/**
 * A Queue from the Database
 */
export interface Queue {
    /**
     * The Name Of The Queue
     */
    name: string,
    /**
     * A Description of the Queue
     */
    description?: string,
    /**
     * The max Amount of Users that the queue can handle
     */
    limit?: number,
    /**
     * The Timeout in Milliseconds if the User disconnects from the Queue (usefull for VC based Queues)
     */
    disconnect_timeout?: number,
    /**
     * The Timeout in Milliseconds that the user is kicked off the queue After not accepting a match
     */
    match_timeout?: number,
    /**
     * A Custom Join Message for the Queue. Use ${pos} ${total} ${eta} ${user} and so on to create Dynamic Messages.
     */
    join_message?: string,
    /**
     *  A Custom Match Found Message for the Queue. Use ${pos} ${total} ${eta} ${user} ${match} ${match_channel} and so on to create Dynamic Messages.
     */
    match_found_message?: string,
    /**
     *  A Custom Timeout Message. Use ${pos} ${total} ${eta} ${user} ${timeout} and so on to create Dynamic Messages.
     */
    timeout_message?: string,
    /**
     *  A Custom Leave Message. Use ${pos} ${total} ${eta} ${user} ${timeout} and so on to create Dynamic Messages.
     */
    leave_message?: string,
    /**
     * A Template for spawning in Rooms (if empty default template is used)
     */
    room_spawner?: VoiceChannelSpawner,
    /**
     * The Entries of the Queue
     */
    entries: QueueEntry[],
}

/**
 * A Schema For storing and Managing Queues
 */
const QueueSchema = new mongoose.Schema<QueueDocument, QueueModel, Queue>({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
    limit: {
        type: Number,
        required: false,
    },
    disconnect_timeout: {
        type: Number,
        required: false,
    },
    match_timeout: {
        type: Number,
        required: false,
    },
    join_message: {
        type: String,
        required: false,
    },
    match_found_message: {
        type: String,
        required: false,
    },
    timeout_message: {
        type: String,
        required: false,
    },
    leave_message: {
        type: String,
        required: false,
    },
    room_spawner: {
        type: VoiceChannelSpawnerSchema,
        required: false,
    },
    entries: [{
        type: QueueEntrySchema,
        required: true,
        default: [],
    }]
});

QueueSchema.method('join', async function (entry: QueueEntry) {
    if (this.entries.find(x => x.discord_id === entry.discord_id)) {
        throw new Error('Dublicate Entry');
    }
    this.entries.push(entry);
    await this.$parent()?.save();
    return entry;
});

QueueSchema.method('leave', async function (discord_id: string) {
    let entry = this.entries.find(x => x.discord_id === discord_id);
    if (!entry) {
        throw new Error('Not Found');
    }
    this.entries.splice(this.entries.indexOf(entry), 1);
    await this.$parent()?.save();
    return entry;
});

QueueSchema.method('getSortedEntries', function (limit?: number) {
    const entries = this.entries.sort((x, y) => {
        const x_importance = (Date.now() - (+x.joinedAt)) * (x.importance || 1);
        const y_importance = (Date.now() - (+y.joinedAt)) * (y.importance || 1);
        return y_importance - x_importance;
    });
    return entries.slice(0, limit);
});

QueueSchema.method('contains', function (discord_id: string): boolean {
    return (this.entries.find(x => x.discord_id === discord_id)) ? true : false;
});

QueueSchema.method('getPosition', function (discord_id: string): number {
    return this.getSortedEntries().findIndex(x => x.discord_id === discord_id);
});

export interface QueueDocument extends Queue, mongoose.Document {
    // List getters or non model methods here
    /**
     * Put an Entry into the Queue
     * @param entry The Queue Entry
     */
    join(entry: QueueEntry): Promise<QueueEntry>,
    /**
     * Gets the Sorted Entries with the First ones being the ones with the highest Importance
     * @param limit How many entries should we get at most?
     */
    getSortedEntries(limit?: number | undefined): QueueEntry[],
    /**
     * Returns true if the ID is contained in the queue
     * @param discord_id the Discord ID to check if it's contained
     */
    contains(discord_id: string): boolean,
    /**
     * Gets the Position in the Current Queue
     * @param discord_id the Discord ID of the entry
     */
    getPosition(discord_id: string): number,
    /**
     * Leaves the queue
     * @param discord_id The Discord ID of the entry
     */
    leave(discord_id: string): Promise<QueueEntry>,
}

export interface QueueModel extends mongoose.Model<QueueDocument> {
    // List Model methods here
}

// Default export
export default QueueSchema;