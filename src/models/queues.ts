import { prop, DocumentType, SubDocumentType, ArraySubDocumentType, mongoose, getModelForClass } from "@typegoose/typegoose";
import { VoiceChannel } from "./voice_channels";
import { QueueEntry } from "./queue_entry";
import * as utils from "../utils/utils";
import { StringReplacements } from "../../typings";
import * as moment from "moment";
import { QueueSpan } from "./queue_span";
import { Guild } from "./guilds";
import { VoiceChannelSpawner } from "./voice_channel_spawner";

/**
 * A Queue from the Database
 */
export class Queue {
    /**
     * The Name Of The Queue
     */
    @prop({ required: true })
        name!: string;
    /**
     * A Description of the Queue
     */
    @prop()
        description?: string;
    /**
     * The max Amount of Users that the queue can handle
     */
    @prop()
        limit?: number;
    /**
     * The Timeout in Milliseconds if the User disconnects from the Queue (usefull for VC based Queues)
     */
    @prop()
        disconnect_timeout?: number;
    /**
     * The Timeout in Milliseconds that the user is kicked off the queue After not accepting a match
     */
    @prop()
        match_timeout?: number;
    /**
     * A Custom Join Message for the Queue. Use ${pos} ${total} ${eta} ${user} and so on to create Dynamic Messages.
     */
    @prop()
        join_message?: string;
    /**
     *  A Custom Match Found Message for the Queue. Use ${pos} ${total} ${eta} ${user} ${match} ${match_channel} and so on to create Dynamic Messages.
     */
    @prop()
        match_found_message?: string;
    /**
     *  A Custom Timeout Message. Use ${pos} ${total} ${eta} ${user} ${timeout} and so on to create Dynamic Messages.
     */
    @prop()
        timeout_message?: string;
    /**
     *  A Custom Leave Message. Use ${pos} ${total} ${eta} ${user} ${timeout} and so on to create Dynamic Messages.
     */
    @prop()
        leave_message?: string;
    /**
     * A Custom Message that is Displayed when the Room is Left (like Please confirm ur stay)
     */
    @prop()
        leave_room_message?: string;
    /**
     * A Template for spawning in Rooms (if empty default template is used)
     */
    @prop({ type: () => VoiceChannelSpawner })
        room_spawner?: SubDocumentType<VoiceChannelSpawner>;
    /**
     * A text Channel to use if dms are disabled
     */
    @prop()
        text_channel?: string;
    /**
     * Whether the queue is locked (this also disables the /queue join command for this queue)
     */
    @prop({ default: false })
        locked?: boolean;
    /**
     * Whether to automatically lock and unlock the queue according to the opening_times
     */
    @prop({ default: false })
        auto_lock?: boolean;
    /**
     * The opening times of the Queue
     */
    @prop({ type: QueueSpan, default: [], required: true })
        opening_times!: mongoose.Types.DocumentArray<ArraySubDocumentType<QueueSpan>>;
    /**
     * The standard time to shift the unlocking of the queue by in milliseconds
     */
    @prop({ default: 0 })
        openShift?: number;
    /**
     * The standard time to shift the locking of the queue by in milliseconds
     */
    @prop({ default: 0 })
        closeShift?: number;
    /**
     * The Entries of the Queue
     */
    @prop({ type: QueueEntry, default: [], required: true })
        entries!: mongoose.Types.DocumentArray<ArraySubDocumentType<QueueEntry>>;

    /**
     * Put an Entry into the Queue
     * @param entry The Queue Entry
     */
    public async join(this: DocumentType<Queue>, entry: QueueEntry): Promise<QueueEntry>{
        if (this.entries.find(x => x.discord_id === entry.discord_id)) {
            throw new Error("Dublicate Entry");
        }
        this.entries.push(entry);
        await this.$parent()?.save();
        return this.getEntry(entry.discord_id)!;
    }

    /**
     * Leaves the queue
     * @param discord_id The Discord ID of the entry
     */
    public async leave(this: DocumentType<Queue>, discord_id: string): Promise<QueueEntry>{
        const entry = this.entries.find(x => x.discord_id === discord_id);
        if (!entry) {
            throw new Error("Not Found");
        }
        this.entries.splice(this.entries.indexOf(entry), 1);
        await this.$parent()?.save();
        return entry;
    }
    /**
     * Gets the Sorted Entries with the First ones being the ones with the highest Importance
     * @param limit How many entries should we get at most?
     */
    public getSortedEntries(this: DocumentType<Queue>, limit?: number | undefined): DocumentType<QueueEntry>[]{
        const entries = this.entries.sort((x, y) => {
            const x_importance = (Date.now() - (+x.joinedAt)) * (x.importance || 1);
            const y_importance = (Date.now() - (+y.joinedAt)) * (y.importance || 1);
            return y_importance - x_importance;
        });
        return entries.slice(0, limit);
    }
    /**
     * Returns true if the ID is contained in the queue
     * @param discord_id the Discord ID to check if it's contained
     */
    public contains(this:DocumentType<Queue>, discord_id: string): boolean {
        return this.entries.some(x => x.discord_id === discord_id);
    }
    /**
     * Gets The Entry that has the given Discord ID
     * @param discord_id The Discord ID of the Entry
     */
    public getEntry(this: DocumentType<Queue>, discord_id: string): DocumentType<QueueEntry> | null {
        return this.entries.find(x => x.discord_id === discord_id) ?? null;
    }
    /**
     * Gets the Position in the Current Queue
     * @param discord_id the Discord ID of the entry
     */
    public getPosition(this: DocumentType<Queue>, discord_id: string): number{
        return this.getSortedEntries().findIndex(x => x.discord_id === discord_id);
    }
    /**
     * Interpolates the Queue String
     * @param string The String to Interpolate
     */
    public interpolateQueueString(this: DocumentType<Queue>, string: string): string | null;
    /**
     * Interpolates the Queue String
     * @param string The String to Interpolate
     * @param discord_id The Discord ID of the Entry
     */
    public interpolateQueueString(this: DocumentType<Queue>, string: string, discord_id: string): string | null;
    /**
     * Interpolates the Queue String
     * @param string The String to Interpolate
     * @param entry The Queue Entry
     */
    public interpolateQueueString(this: DocumentType<Queue>, string: string, entry: QueueEntry): string | null;
    /**
     * Interpolates the Queue String
     * @param string The String to Interpolate
     * @param entry_resolvable The Entry Resolvable
     */
    public interpolateQueueString(this: DocumentType<Queue>, string: string, entry_resolvable?: string | QueueEntry | undefined): string | null;
    /**
     * Interpolates the Queue String
     * @param string The String to Interpolate
     * @param entry_resolvable The Entry Resolvable
     */
    public interpolateQueueString(this: DocumentType<Queue>, string:string, entry_resolvable?: string | QueueEntry | undefined): string | null{
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
    }
    /**
     * Gets the leave Message of the Queue
     */
    public getLeaveMessage(this: DocumentType<Queue>): string;
    /**
     * Gets the leave Message of the Queue
     * @param discord_id The Discord ID of the Leaver
     */
    public getLeaveMessage(this: DocumentType<Queue>, discord_id: string): string;
    /**
     * Gets the leave Message of the Queue
     * @param entry The Entry that wants to leave the queue
     */
    public getLeaveMessage(this: DocumentType<Queue>, entry: QueueEntry): string;
    /**
     * Gets the leave Message of the Queue
     * @param entry_resolvable The Entry Resolvable
     */
    public getLeaveMessage(this: DocumentType<Queue>, entry_resolvable?: string | QueueEntry | undefined): string{
        const default_leave_message = "You left the Queue.";
        if (this.leave_message) {
            const leave_msg = this.interpolateQueueString(this.leave_message!, entry_resolvable);
            return leave_msg ?? default_leave_message;
        }
        else {
            return default_leave_message;
        }
    }
    /**
     * Gets the leave Room Message of the Queue
     */
    public getLeaveRoomMessage(this: DocumentType<Queue>): string;
    /**
     * Gets the leave Room Message of the Queue
     * @param discord_id The Discord ID of the Leaver
     */
    public getLeaveRoomMessage(this: DocumentType<Queue>, discord_id: string): string;
    /**
     * Gets the leave Room Message of the Queue
     * @param entry The Entry that wants to leave the queue
     */
    public getLeaveRoomMessage(this: DocumentType<Queue>, entry: QueueEntry): string;
    /**
     * Gets the leave Room Message of the Queue
     * @param entry_resolvable The Entry Resolvable
     */
    public getLeaveRoomMessage(this: DocumentType<Queue>, entry_resolvable?: string | QueueEntry | undefined): string{
        const default_leave_message = `You left the Room. Please confirm your stay or you will be removed from the queue after the Timeout of ${(this.disconnect_timeout ?? 0) / 1000}s.`;
        if (this.leave_room_message) {
            const leave_msg = this.interpolateQueueString(this.leave_room_message, entry_resolvable);
            return leave_msg ?? default_leave_message;
        }
        else {
            return default_leave_message;
        }
    }
    /**
     * Gets the join Message of the Queue
     */
    public getJoinMessage(this: DocumentType<Queue>): string;
    /**
     * Gets the join Message of the Queue
     * @param discord_id The Discord ID of the Joiner
     */
    public getJoinMessage(this: DocumentType<Queue>, discord_id: string): string;
    /**
     * Gets the join Message of the Queue
     * @param entry The Entry that wants to join the queue
     */
    public getJoinMessage(this: DocumentType<Queue>, entry: QueueEntry): string;
    /**
     * Gets the leave Message of the Queue
     * @param entry_resolvable The Entry Resolvable
     */
    public getJoinMessage(this: DocumentType<Queue>, entry_resolvable?: string | QueueEntry | undefined): string{
        const default_join_message = "You left the Queue.";
        if (this.join_message) {
            const join_msg = this.interpolateQueueString(this.join_message, entry_resolvable);
            return join_msg ?? default_join_message;
        }
        else {
            return default_join_message;
        }
    }
    /**
     * Returns `true` if the Queue is Empty
     */
    public isEmpty(this: DocumentType<Queue>): boolean{
        return this.entries.length < 1;
    }
    /**
     * Locks the queue. This removes the voice Channel Permissions and disallows the queue from the /queue join command
     */
    public async lock(this: DocumentType<Queue>): Promise<void>{
        this.locked = true;
        await this.$parent()?.save();
    }
    /**
     * Unlocks the queue. This restores the voice Channel Permissions and allows the queue from the /queue join command
     */
    public async unlock(this: DocumentType<Queue>): Promise<void>{
        this.locked = false;
        await this.$parent()?.save();
    }
    /**
     * Locks or Unlocks the queue (opposite State).
     */
    public async toggleLock(this: DocumentType<Queue>): Promise<void>{
        this.locked = !this.locked;
        await this.$parent()?.save();
    }
    /**
     * Resolves all Waiting rooms for the current Queue
     */
    public getWaitingRooms(this: DocumentType<Queue>, guild: Guild): DocumentType<VoiceChannel>[]{
        return guild.voice_channels?.filter(x => x.queue?._id.equals(this._id!)) ?? [];
    }
}

export const QueueModel = getModelForClass(Queue, {
    schemaOptions: {
        autoCreate: false,
    },
});