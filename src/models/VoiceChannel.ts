import { getModelForClass, mongoose, prop, Ref, SubDocumentType } from "@typegoose/typegoose";
import { VoiceChannelSpawner } from "./VoiceChannelSpawner";
import { Queue } from "./Queue";
import { ChannelType } from "discord.js";
import { Channel } from "./TextChannel";

export class VoiceChannel implements Channel {
    @prop({ required: true })
        _id!: string;
    @prop({ required: true, type: Number, enum: [0, 1, 2, 3, 4, 5, 6, 7] })
        channel_type!: ChannelType;
    @prop({ required: true })
        managed!: boolean;
    @prop()
        category?: string | undefined;
    @prop()
        owner?: string | undefined;
    /**
     * If the channel is an AFK-Hell (constantly plays a Song)
     */
    @prop({ default: false })
        afkhell?: boolean;
    /**
     * The Song Link for AFK Hell
     */
    @prop()
        song_link?: string;
    /**
     * If the voice Channel is locked to a specific user group (used to keep track of lock icon)
     */
    @prop({ required: true, default: false })
        locked!: boolean;
    /**
     * The Permitted Users/Roles that can enter this channel
     */
    @prop({ required: true, type: String, default: [] })
        permitted!: mongoose.Types.Array<string>;
    /**
     * Makes the Channel a spawner Channel which creates a new channel for every joined member
     */
    @prop({ required: false, type: () => VoiceChannelSpawner })
        spawner?: SubDocumentType<VoiceChannelSpawner>;
    /**
     * The Channel Prefix
     */
    @prop()
        prefix?: string;
    /**
     * A Queue that is entered with joining this Channel
     */
    @prop({ ref: () => Queue })
        queue?: Ref<Queue>;
    /**
     * If the VC is a Temporary Voice Channel
     */
    @prop({ default: false })
        temporary?: boolean;
    /**
     * The Channel Supervisor Roles/ User IDs
     */
    @prop({ type: String, default: [] })
        supervisors?: mongoose.Types.Array<string>;
}

export const VoiceChannelModel = getModelForClass(VoiceChannel, {
    schemaOptions: {
        autoCreate: false,
    },
});