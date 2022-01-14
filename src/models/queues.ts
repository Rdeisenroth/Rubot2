import { GuildDocument } from "./guilds";
import { VoiceChannelDocument } from "./voice_channels";
import mongoose from "mongoose";
import QueueEntrySchema, { QueueEntry, QueueEntryDocument } from "./queue_entry";
import VoiceChannelSpawnerSchema, { VoiceChannelSpawner, VoiceChannelSpawnerDocument } from "./voice_channel_spawner";
import * as utils from "../utils/utils";
import { StringReplacements } from "../../typings";
import moment from "moment";

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
     * A Custom Message that is Displayed when the Room is Left (like Please confirm ur stay)
     */
    leave_room_message?: string,
    /**
     * A Template for spawning in Rooms (if empty default template is used)
     */
    room_spawner?: VoiceChannelSpawner,
    /**
     * A text Channel to use if dms are disabled
     */
    text_channel?: string,
    /**
     * Whether the queue is locked (this also disables the /queue join command for this queue)
     */
    locked?: boolean,
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
    leave_room_message: {
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
    locked: {
        type: mongoose.SchemaTypes.Boolean,
        required: false,
        default: false,
    },
    entries: [{
        type: QueueEntrySchema,
        required: true,
        default: [],
    }],
});

export interface QueueDocument extends Queue, mongoose.Document<mongoose.Types.ObjectId> {
    room_spawner?: VoiceChannelSpawnerDocument,
    entries: mongoose.Types.DocumentArray<QueueEntryDocument>,
    // List getters or non model methods here
    /**
     * Put an Entry into the Queue
     * @param entry The Queue Entry
     */
    join(entry: QueueEntry): Promise<QueueEntryDocument>,
    /**
     * Gets the Sorted Entries with the First ones being the ones with the highest Importance
     * @param limit How many entries should we get at most?
     */
    getSortedEntries(limit?: number | undefined): QueueEntryDocument[],
    /**
     * Returns true if the ID is contained in the queue
     * @param discord_id the Discord ID to check if it's contained
     */
    contains(discord_id: string): boolean,
    /**
     * Gets The Entry that has the given Discord ID
     * @param discord_id The Discord ID of the Entry
     */
    getEntry(discord_id: string): QueueEntryDocument | null,
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
    /**
     * Interpolates the Queue String
     * @param string The String to Interpolate
     */
    interpolateQueueString(string: string): string | null,
    /**
     * Interpolates the Queue String
     * @param string The String to Interpolate
     * @param discord_id The Discord ID of the Entry
     */
    interpolateQueueString(string: string, discord_id: string): string | null,
    /**
     * Interpolates the Queue String
     * @param string The String to Interpolate
     * @param entry The Queue Entry
     */
    interpolateQueueString(string: string, entry: QueueEntry): string | null,
    /**
     * Interpolates the Queue String
     * @param string The String to Interpolate
     * @param entry_resolvable The Entry Resolvable
     */
    interpolateQueueString(string: string, entry_resolvable?: string | QueueEntry | undefined): string | null,
    /**
     * Gets the leave Message of the Queue
     */
    getLeaveMessage(): string,
    /**
     * Gets the leave Message of the Queue
     * @param discord_id The Discord ID of the Leaver
     */
    getLeaveMessage(discord_id: string): string,
    /**
     * Gets the leave Message of the Queue
     * @param entry The Entry that wants to leave the queue
     */
    getLeaveMessage(entry: QueueEntry): string,
    /**
     * Gets the leave Message of the Queue
     * @param entry_resolvable The Entry Resolvable
     */
    getLeaveMessage(entry_resolvable?: string | QueueEntry | undefined): string,
    /**
     * Gets the leave Room Message of the Queue
     */
    getLeaveRoomMessage(): string,
    /**
     * Gets the leave Room Message of the Queue
     * @param discord_id The Discord ID of the Leaver
     */
    getLeaveRoomMessage(discord_id: string): string,
    /**
     * Gets the leave Room Message of the Queue
     * @param entry The Entry that wants to leave the queue
     */
    getLeaveRoomMessage(entry: QueueEntry): string,
    /**
     * Gets the leave Room Message of the Queue
     * @param entry_resolvable The Entry Resolvable
     */
    getLeaveRoomMessage(entry_resolvable?: string | QueueEntry | undefined): string,
    /**
     * Gets the join Message of the Queue
     */
    getJoinMessage(): string,
    /**
     * Gets the join Message of the Queue
     * @param discord_id The Discord ID of the Joiner
     */
    getJoinMessage(discord_id: string): string,
    /**
     * Gets the join Message of the Queue
     * @param entry The Entry that wants to join the queue
     */
    getJoinMessage(entry: QueueEntry): string,
    /**
     * Gets the leave Message of the Queue
     * @param entry_resolvable The Entry Resolvable
     */
    getJoinMessage(entry_resolvable?: string | QueueEntry | undefined): string,
    /**
     * Returns `true` if the Queue is Empty
     */
    isEmpty(): boolean,
    /**
     * Locks the queue. This removes the voice Channel Permissions and disallows the queue from the /queue join command
     */
    lock(): Promise<void>;
    /**
     * Unlocks the queue. This restores the voice Channel Permissions and allows the queue from the /queue join command
     */
    unlock(): Promise<void>;
    /**
     * Locks or Unlocks the queue (opposite State).
     */
    toggleLock(): Promise<void>;
    /**
     * Resolves all Waiting rooms for the current Queue
     */
    getWaitingRooms(guild: GuildDocument): VoiceChannelDocument[],
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QueueModel extends mongoose.Model<QueueDocument> {
    // List Model methods here
}

// --Methods--

QueueSchema.method("join", async function (entry: QueueEntry) {
    if (this.entries.find(x => x.discord_id === entry.discord_id)) {
        throw new Error("Dublicate Entry");
    }
    this.entries.push(entry);
    await this.$parent()?.save();
    return this.getEntry(entry.discord_id)!;
});

QueueSchema.method("leave", async function (discord_id: string) {
    const entry = this.entries.find(x => x.discord_id === discord_id);
    if (!entry) {
        throw new Error("Not Found");
    }
    this.entries.splice(this.entries.indexOf(entry), 1);
    await this.$parent()?.save();
    return entry;
});

QueueSchema.method("getSortedEntries", function (limit?: number) {
    const entries = this.entries.toObject<Array<QueueEntryDocument>>().sort((x, y) => {
        const x_importance = (Date.now() - (+x.joinedAt)) * (x.importance || 1);
        const y_importance = (Date.now() - (+y.joinedAt)) * (y.importance || 1);
        return y_importance - x_importance;
    });
    return entries.slice(0, limit);
});

QueueSchema.method("isEmpty", function (): boolean {
    return this.entries.length < 1;
});
QueueSchema.method("contains", function (discord_id: string): boolean {
    return (this.entries.toObject<Array<QueueEntryDocument>>().find(x => x.discord_id === discord_id)) ? true : false;
});
QueueSchema.method("getEntry", function (discord_id: string) {
    return this.entries.find(x => x.discord_id === discord_id) ?? null;
});

QueueSchema.method("getPosition", function (discord_id: string): number {
    return this.getSortedEntries().findIndex(x => x.discord_id === discord_id);
});

QueueSchema.method("interpolateQueueString", function (string: string, entry_resolvable?: string | QueueEntry): string | null {
    try {
        const replacements: StringReplacements = {
            "limit": this.limit,
            "name": this.name,
            "description": this.description,
            "eta": "null",
            "timeout": (this.disconnect_timeout ?? 0) / 1000,
            "total": this.entries.length,
        };

        if (entry_resolvable) {
            let entry: QueueEntry | null;
            if (typeof entry_resolvable === "string") {
                entry = this.getEntry(entry_resolvable);
            } else {
                entry = entry_resolvable;
            }
            if (entry && this.contains(entry.discord_id)) {
                const entryReplacements: StringReplacements = {
                    "member_id": entry.discord_id,
                    "user": `<@${entry.discord_id}>`,
                    "pos": this.getPosition(entry.discord_id) + 1,
                    "time_spent": moment.duration(Date.now() - (+entry.joinedAt)).format("d[d ]h[h ]m[m ]s.S[s]"),
                };
                for (const [key, value] of Object.entries(entryReplacements)) {
                    replacements[key] = value;
                }
            }
        }
        // Interpolate String
        return utils.general.interpolateString(string, replacements);
    } catch (error) {
        console.log(error);
        return null;
    }
});


QueueSchema.method("getJoinMessage", function (entry_resolvable?: string | QueueEntry) {
    const default_join_message = "You left the Queue.";
    if (this.join_message) {
        const join_msg = this.interpolateQueueString(this.join_message, entry_resolvable);
        return join_msg ?? default_join_message;
    }
    else {
        return default_join_message;
    }
});

QueueSchema.method("getLeaveMessage", function (entry_resolvable?: string | QueueEntry) {
    const default_leave_message = "You left the Queue.";
    if (this.leave_message) {
        const leave_msg = this.interpolateQueueString(this.leave_message, entry_resolvable);
        return leave_msg ?? default_leave_message;
    }
    else {
        return default_leave_message;
    }
});

QueueSchema.method("getLeaveRoomMessage", function (entry_resolvable?: string | QueueEntry) {
    const default_leave_message = `You left the Room. Please confirm your stay or you will be removed from the queue after the Timeout of ${(this.disconnect_timeout ?? 0) / 1000}s.`;
    if (this.leave_room_message) {
        const leave_msg = this.interpolateQueueString(this.leave_room_message, entry_resolvable);
        return leave_msg ?? default_leave_message;
    }
    else {
        return default_leave_message;
    }
});

QueueSchema.method("lock", async function () {
    this.locked = true;
    await this.$parent()?.save();
});

QueueSchema.method("unlock", async function () {
    this.locked = false;
    await this.$parent()?.save();
});

QueueSchema.method("toggleLock", async function () {
    this.locked = !this.locked;
    await this.$parent()?.save();
});

QueueSchema.method("getWaitingRooms", function (guild: GuildDocument) {
    return guild.voice_channels?.filter(x => x.queue?.equals(this._id!)) ?? [];
});

// Default export
export default QueueSchema;