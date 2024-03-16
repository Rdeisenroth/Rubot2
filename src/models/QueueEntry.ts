import { getModelForClass, prop } from "@typegoose/typegoose";

/**
 * A Queue Entry
 */
export class QueueEntry {
    /**
     * The Discord Client ID of the queue Member
     */
    @prop({ required: true })
        discord_id!: string;
    /**
     * The Unix Time Stamp of the Queue entry point
     */
    @prop({ required: true })
        joinedAt!: string;
    /**
     * A Multiplier for Importance (use carefully) default is 1
     */
    @prop({ required: false, default: 1 })
        importance?: number;
    /**
     * An intent specified by the User and can be seen by Queue Managers (the ones who accept queues)
     */
    @prop({ required: false })
        intent?: string;
}