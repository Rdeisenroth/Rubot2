import { prop } from "@typegoose/typegoose";

export enum VoiceChannelEventType {
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

export enum QueueEventType {
    JOIN = "join",
    LEAVE = "leave",
    KICK = "kick",
    NEXT = "next",
    TUTOR_SESSION_START = "tutor_session_start",
    TUTOR_SESSION_QUIT = "tutor_session_quit",
    OTHER = "other",
}

/**
 * An Event that is stored in the Database
 */
export abstract class Event<T> {
    /**
     * The Unix Time Stamp of the Event
     */
    @prop({ required: true })
        timestamp!: string;

    /**
     * The Event Type
     */
    abstract type: T;
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

/**
 * An Event concerning a Voice Channel
 */
export class VoiceChannelEvent extends Event<VoiceChannelEventType> {
    @prop({ required: true, enum: VoiceChannelEventType, default: VoiceChannelEventType.other })
        type!: VoiceChannelEventType;
}

/**
 * An Event concerning a Queue
 */
export class QueueEvent extends Event<QueueEventType> {
    @prop({ required: true, enum: QueueEventType, default: QueueEventType.OTHER })
        type!: QueueEventType;
}