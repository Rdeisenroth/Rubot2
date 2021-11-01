import mongoose from "mongoose";

export enum eventType {
    "create_channel" = "create_channel",
    "destroy_channel" = "destroy_channel",
    "move_member" = "move_member",
    "permit_member" = "permit_member",
    "kick_member" = "kick_member",
    "lock_channel" = "lock_channel",
    "unlock_channel" = "unlock_channel",
    "hide_channel" = "hide_channel",
    "unhide_channel" = "unhide_channel",
    "user_leave" = "user_leave",
    "user_join" = "user_join",
    "permission_change" = "permission_change",
    "other" = "other",
}

/**
 * A Guild from the Database
 */
export interface Event {
    /**
     * The Unix Time Stamp of the Event
     */
    timestamp: string,
    /**
     * The Event Type
     */
    type: eventType,
    /**
     * Client ID or "me"
     */
    emitted_by: string,
    /**
     * A Target that was affected
     */
    target?: string,
    /**
     * The Reason why the Event was Emitted
     */
    reason?: string,
}

/**
 * A Schema For storing and Managing Guilds
 */
const EventSchema = new mongoose.Schema<EventDocument, EventModel, Event>({
    timestamp: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: [...Object.keys(eventType)],
        default: eventType.other,
        required: true,
    },
    emitted_by: {
        type: String,
        required: true,
    },
    target: {
        type: String,
        required: false,
    },
    reason: {
        type: String,
        required: false,
    },
});

export interface EventDocument extends Event, mongoose.Document<mongoose.Types.ObjectId> {
    // List getters or non model methods here
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EventModel extends mongoose.Model<EventDocument> {
    // List Model methods here
}

// Default export
export default EventSchema;