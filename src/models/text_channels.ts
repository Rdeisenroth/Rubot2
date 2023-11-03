import { ChannelType, TextChannelType } from "discord.js";
import { getModelForClass, prop } from "@typegoose/typegoose";

/**
 * Database Representation of a Discord Channel
 */
export interface Channel {
    /**
     * The Channel ID
     */
    _id: string,
    /**
     * The Channel Type
     */
    channel_type: ChannelType,
    /**
     * Whether the Channel is being managed by or relevant to the bot
     */
    managed: boolean,
    /**
     * The Parent Category channel
     */
    category?: string,
    /**
     * The Channel owner
     */
    owner?: string,
}

export class TextChannel implements Channel {
    @prop({ required: true })
        _id!: string;
    @prop({ required: true, type: Number, enum: [ChannelType.DM, ChannelType.GroupDM, ChannelType.GuildAnnouncement, ChannelType.PublicThread, ChannelType.PrivateThread, ChannelType.AnnouncementThread, ChannelType.GuildText, ChannelType.GuildForum, ChannelType.GuildVoice, ChannelType.GuildStageVoice] })
        channel_type!: TextChannelType;
    @prop({ required: true })
        managed!: boolean;
    @prop()
        category?: string | undefined;
    @prop()
        owner?: string | undefined;
    /**
     * Channel Specific Prefix, cuz why not? :D
     */
    @prop()
        prefix?: string;
    /**
     * If the Bot is enabled in this channel
     */
    @prop({ required: true })
        listen_for_commands!: boolean;
    /**
     * WHETHER THE CHANNEL IS CAPS-ONLY
     */
    @prop({ default: false })
        rage_channel?: boolean;
}

export const TextChannelModel = getModelForClass(TextChannel, {
    schemaOptions: {
        autoCreate: false,
    },
});