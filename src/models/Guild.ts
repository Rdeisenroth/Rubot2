import { prop, getModelForClass, SubDocumentType, ArraySubDocumentType, mongoose } from "@typegoose/typegoose";
import { GuildSettings } from "./GuildSettings";
import { TextChannel } from "./TextChannel";
import { VoiceChannel } from "./VoiceChannel";
import { Queue } from "./Queue";

/**
 * A Guild from the Database
 */
export class Guild {
    /**
     * The Guild ID provided by Discord
     */
    @prop({ required: true })
        _id!: string;
    /**
     * The Name of the Guild
     */
    @prop({ required: true })
        name!: string;
    /**
     * The Member Count (Makes it easier to sort Guilds by member counts)
     */
    @prop({ required: true, default: 0 })
        member_count!: number;
    /**
     * The Settings for the Guild
     */
    @prop({ required: true, type: () => GuildSettings })
        guild_settings!: SubDocumentType<GuildSettings>;
    /**
     * The Relevant Text Channels of the Guild
     */
    @prop({ required: true, default: [], type: () => [TextChannel] })
        text_channels!: mongoose.Types.DocumentArray<ArraySubDocumentType<TextChannel>>;
    /**
     * The Relevant Voice Channels of the Guild
     */
    @prop({ required: true, default: [], type: () => [VoiceChannel] })
        voice_channels!: mongoose.Types.DocumentArray<ArraySubDocumentType<VoiceChannel>>;
    /**
     * The Queues of the Guild
     */
    @prop({ required: true, default: [], type: () => [Queue] })
        queues!: mongoose.Types.DocumentArray<ArraySubDocumentType<Queue>>;
    /**
     * The Welcome Message Text
     */
    @prop()
        welcome_text?: string;
    /**
     * The Welcome Message Title
     */
    @prop()
        welcome_title?: string;
}

export const GuildModel = getModelForClass(Guild, {
    schemaOptions: {
        autoCreate: true,
    },
});