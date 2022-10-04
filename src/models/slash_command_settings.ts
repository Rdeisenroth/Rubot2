import SlashCommandPermissionSchema, { SlashCommandPermission, SlashCommandPermissionDocument } from "./slash_command_permission";
import mongoose from "mongoose";
import { PermissionResolvable } from "discord.js";

export interface SlashCommandSettings {
    /**
     * The original Command name used to retrieve it from the event handler
     */
    internal_name: string,
    /**
     * The Command Name overwrite
     */
    name?: string,
    /**
     * The Command Description overwrite
     */
    description?: string,
    /**
     * The Default Command Permission overwrite
     */
    defaultPermission?: PermissionResolvable,
    /**
     * If the command should be completely removed from the slash command List
     */
    disabled?: boolean,
    /**
     * All the command aliases (won't be shown general help)
     */
    aliases: string[],
    /**
     * The Command permissions
     */
    permissions: SlashCommandPermission[],
}

const SlashCommandSettingsSchema = new mongoose.Schema<SlashCommandSettingsDocument, SlashCommandSettingsModel, SlashCommandSettings>({
    internal_name: {
        type: String,
        required: true,
        sparse: true,
        // unique: true,
    },
    name: {
        type: String,
        required: false,
    },
    description: {
        type: String,
        required: false,
    },
    disabled: {
        type: Boolean,
        required: false,
    },
    aliases: [{
        type: String,
        required: true,
        default: [],
    }],
    permissions: [SlashCommandPermissionSchema],
    //     defaultPermission: {
    //         type: String,
    //         required: false,
    //     },
});

export interface SlashCommandSettingsDocument extends SlashCommandSettings, mongoose.Document < mongoose.Types.ObjectId > {
    aliases: mongoose.Types.Array<string>,
    permissions: mongoose.Types.DocumentArray<SlashCommandPermissionDocument>,
    // defaultPermission: string,
    /**
     * Gets postable Permission objects off the settings
     */
    getPostablePermissions(): SlashCommandPermission[],
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SlashCommandSettingsModel extends mongoose.Model<SlashCommandSettingsDocument> {

}

// Methods

SlashCommandSettingsSchema.method<SlashCommandSettingsDocument>("getPostablePermissions", function () {
    return this.permissions.toObject<Array<SlashCommandPermissionDocument>>()
        .map(x => { return { id: x.id, permission: x.permission, type: x.type } as SlashCommandPermission; });
});

// Default export
export default SlashCommandSettingsSchema;