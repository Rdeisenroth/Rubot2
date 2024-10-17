import { DBRole } from "./bot_roles";
import { SlashCommandSettings } from "./slash_command_settings";
import { ArraySubDocumentType, DocumentType, mongoose, prop } from "@typegoose/typegoose";

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

    /**
     * Checks whether command Settings exist
     * @param name The internal Command Name
     */
    public hasCommandSettings(this: DocumentType<GuildSettings>, name: string): boolean {
        return this.slashCommands.some(x => x.internal_name === name);
    }

    /**
     * Gets the Settings for a specified command
     * @param name The internal Command Name
     */
    public getCommandByInternalName(this: DocumentType<GuildSettings>, name: string): DocumentType<SlashCommandSettings> | null {
        return this.slashCommands.find(x => x.internal_name === name) ?? null;
    }

    /**
     * Gets the Settings for a specified command
     * @param name The guild Command Name
     */
    public getCommandByGuildName(this: DocumentType<GuildSettings>, name: string): SlashCommandSettings | null {
        return this.slashCommands.find(x => x.name === name) ?? this.getCommandByInternalName(name);
    }

    /**
     * Gets the Settings for a specified command
     * @param name The guild Command Name
     */
    public async getOrCreateCommandByInternalName(this: DocumentType<GuildSettings>, name: string): Promise<DocumentType<SlashCommandSettings>> {
        if (!this.hasCommandSettings(name)) {
            this.slashCommands.push({
                internal_name: name,
                aliases: [],
                permissions: [],
            });
            await this.$parent()?.save();
        }
        return this.getCommandByInternalName(name)!;
    }
}