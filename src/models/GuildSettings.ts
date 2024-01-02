import { prop, mongoose, Ref, modelOptions, getModelForClass, DocumentType, ArraySubDocumentType } from "@typegoose/typegoose";
import { SlashCommandSettings } from "./SlashCommandSettings";
import { DBRole } from "./BotRoles";

/**
 * Command Listen Modes
 */
export enum CommandListenMode {
    WHITELIST = 0,
    BLACKLIST = 1
}

export class GuildSettings {
    /**
     * @deprecated
     * The Bot Prefix for the Guild
     */
    @prop({ required: true, default: "!" })
        prefix!: string;
    /**
     * @deprecated
     * The Command Listen Mode for The Guild
     */
    @prop({ required: true, enum: CommandListenMode, default: CommandListenMode.BLACKLIST })
        command_listen_mode!: CommandListenMode;
    /**
     * The Guild Specific command Settings
     */
    @prop({ required: true, default: [], type: () => SlashCommandSettings })
        slashCommands!: mongoose.Types.DocumentArray<ArraySubDocumentType<SlashCommandSettings>>;
    /**
     * The Guild Specific role Settings
     */
    @prop({ default: [], type: () => DBRole })
        roles?: mongoose.Types.DocumentArray<ArraySubDocumentType<DBRole>>;
    /**
     * The User Account URL related to the guild
     */
    @prop()
        account_url?: string;
}