import { ApplicationCommandPermissionData, ApplicationCommandPermissionType, OverwriteData, PermissionString, Snowflake } from "discord.js";
import { ApplicationCommandPermissionTypes } from "discord.js/typings/enums";
import mongoose from "mongoose";

export interface SlashCommandPermission extends ApplicationCommandPermissionData {
    /**
     * The User or Role ID
     */
    id: string,
    /**
     * The ID Type (Role or User)
     */
    type: ApplicationCommandPermissionTypes;
    /**
     * Whether to permit or not permit the User Or Role
     */
    permission: boolean;
}

const SlashCommandPermissionSchema = new mongoose.Schema<SlashCommandPermissionDocument, SlashCommandPermissionModel, SlashCommandPermission>({
    id: {
        type: String,
        required: true,
    },
    type: {
        type: Number,
        enum: [1, 2],
        default: 2,
        required: true,
    },
    permission: {
        type: Boolean,
        required: true,
    },
});

export interface SlashCommandPermissionDocument extends SlashCommandPermission, Omit<mongoose.Document, "id"> {
    
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SlashCommandPermissionModel extends mongoose.Model<SlashCommandPermissionDocument> {

}

// Default export
export default SlashCommandPermissionSchema;