import { PermissionOverwriteData } from "./permission_overwrite_data";
import { prop, mongoose, getModelForClass, ArraySubDocumentType } from "@typegoose/typegoose";

export class VoiceChannelSpawner {
    /**
     * overwrite the VC Owner for the Bot
     */
    @prop()
        owner?: string;
    /**
     * The Roles that can moderate this channel
     */
    @prop({ required: true, type: () => [String], default: [] })
        supervisor_roles!: mongoose.Types.Array<string>;
    /**
     * The Channel Permissions
     */
    @prop({ required: true, type: () => [PermissionOverwriteData], default: [] })
        permission_overwrites!: mongoose.Types.DocumentArray<ArraySubDocumentType<PermissionOverwriteData>>;
    /**
     * Limit the amount of Users that can join the channel
     */
    @prop()
        max_users?: number;
    /**
     * The Name of the Channel; use ${owner} and so on to create dynamic channel names
     */
    @prop({ required: true, default: "${owner_name}'s VC" })
        name!: string;
    /**
     * Whether the Channel should initially be locked or not
     */
    @prop({ default: false })
        lock_initially?: boolean;
    /**
     * Whether the Channel should initially be hidden or not
     */
    @prop({ default: false })
        hide_initially?: boolean;
    /**
     * The Category Channel ID
     */
    @prop()
        parent?: string;
}

export const VoiceChannelSpawnerModel = getModelForClass(VoiceChannelSpawner, {
    schemaOptions: {
        autoCreate: false,
    },
});