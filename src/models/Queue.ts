import { prop, mongoose, SubDocumentType, ArraySubDocumentType, getModelForClass } from '@typegoose/typegoose';
import { VoiceChannelSpawner } from './VoiceChannelSpawner';
import { QueueEventType } from './Event';
import { QueueSpan } from './QueueSpan';
import { QueueEntry } from './QueueEntry';
import { DocumentType } from '@typegoose/typegoose';

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
     * Text Channels ids to log queue events
     */
    @prop({ default: [], required: false })
        info_channels!: {
            channel_id: string;
            events: QueueEventType[];
    }[];
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
     * Gets the Sorted Entries with the First ones being the ones with the highest Importance
     * @param limit How many entries should we get at most?
     */
    public getSortedEntries(this: DocumentType<Queue>, limit?: number | undefined): DocumentType<QueueEntry>[] {
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
    public contains(this: DocumentType<Queue>, discord_id: string): boolean {
        return this.entries.some(x => x.discord_id === discord_id);
    }

    /**
     * Gets the Position in the Current Queue
     * @param discord_id the Discord ID of the entry
     */
    public getPosition(this: DocumentType<Queue>, discord_id: string): number {
        return this.getSortedEntries().findIndex(x => x.discord_id === discord_id) + 1;
    }
    
}

export const QueueModel = getModelForClass(Queue, {
    schemaOptions: {
        autoCreate: false,
    },
});