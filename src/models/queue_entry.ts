import mongoose from "mongoose";

/**
 * A Schema For storing and Managing Guilds
 */
const QueueEntrySchema = new mongoose.Schema<QueueEntryDocument, QueueEntryModel>({
    /**
     * The Discord Client ID of the queue Member
     */
    discord_id: {
        type: String,
        required: true,
    },
    /**
     * The Unix Time Stamp of the Queue entry point
     */
    joinedAt: {
        type: String,
        required: true,
    },
    /**
     * A Multiplier for Importance (use carefully) default is 1
     */
    importance: {
        type: Number,
        required: false,
        default: 1,
    },
    /**
     * An intent specified by the User and can be seen by Queue Managers (the ones who accept queues)
     */
    intent: {
        type: String,
        required: false,
    },
});

// TODO Find better Names so that they don't conflict with discordjs Interfaces
/**
 * A Guild from the Database
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

export interface QueueEntryDocument extends QueueEntry, mongoose.Document {
    // List getters or non model methods here
}

export interface QueueEntryModel extends mongoose.Model<QueueEntryDocument> {
    // List Model methods here
}

// Default export
export default QueueEntrySchema;