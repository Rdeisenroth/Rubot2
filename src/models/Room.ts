import { ArraySubDocumentType, getModelForClass, mongoose, prop } from "@typegoose/typegoose";
import { VoiceChannelEvent } from "./Event";

export class Room {
    /**
     * The Channel ID provided by Discord
     */
    @prop({ required: true })
    _id!: string;
    /**
     * If the Channel exists, it's active
     */
    @prop({ required: true })
    active!: boolean;
    /**
     * If Someone tampered with the Permissions/Name or Position of the Channel (or other Settings)
     */
    @prop({ required: true })
    tampered!: boolean;
    /**
     *  Only set to true if session had a clean exit
     */
    @prop({ required: true })
    end_certain!: boolean;
    /**
     * The Guild The Room is in
     */
    @prop({ required: true })
    guild!: string;
    /**
     * The Events that happen in the Channel
     */
    @prop({ required: true, type: () => [VoiceChannelEvent], default: [] })
    events!: mongoose.Types.DocumentArray<ArraySubDocumentType<VoiceChannelEvent>>;
}

export const RoomModel = getModelForClass(Room, {
    schemaOptions: {
        autoCreate: true,
    },
});
