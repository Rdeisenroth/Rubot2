import mongoose from "mongoose";

/**
 * A Queue Entry
 */
export interface QueueEntry {
    /**
     * The Discord Client ID of the queue Member
     */
    discord_id: string,
    /**
     * The Unix Time Stamp of the Queue entry point
     */
    joinedAt: string,
    /**
     * A Multiplier for Importance (use carefully) default is 1
     */
    importance?: number,
    /**
     * An intent specified by the User and can be seen by Queue Managers (the ones who accept queues)
     */
    intent?: string,
}

/**
 * A Schema of a Queue Entry
 */
const QueueEntrySchema = new mongoose.Schema<QueueEntryDocument, QueueEntryModel, QueueEntry>({
    discord_id: {
        type: String,
        required: true,
    },
    joinedAt: {
        type: String,
        required: true,
    },
    importance: {
        type: Number,
        required: false,
        default: 1,
    },
    intent: {
        type: String,
        required: false,
    },
});

export interface QueueEntryDocument extends QueueEntry, mongoose.Document<mongoose.Types.ObjectId> {
    // List getters or non model methods here
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QueueEntryModel extends mongoose.Model<QueueEntryDocument> {
    // List Model methods here
}

// Default export
export default QueueEntrySchema;