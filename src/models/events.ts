import { getModelForClass, prop } from "@typegoose/typegoose";

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
export class Event {
    /**
     * The Unix Time Stamp of the Event
     */
    @prop({ required: true })
        timestamp!: string;
    /**
     * The Event Type
     */
    @prop({ required: true, enum: eventType, default: eventType.other })
        type!: eventType;
    /**
     * Client ID or "me"
     */
    @prop({ required: true })
        emitted_by!: string;
    /**
     * A Target that was affected
     */
    @prop({ required: false })
        target?: string;
    /**
     * The Reason why the Event was Emitted
     */
    @prop({ required: false })
        reason?: string;
}

export const EventModel = getModelForClass(Event, {
    schemaOptions: {
        autoCreate: false,
    },
});