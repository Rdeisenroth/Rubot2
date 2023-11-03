import { SlashCommandPermission } from "./slash_command_permission";
import { PermissionResolvable } from "discord.js";
import { ArraySubDocumentType, getModelForClass, prop, mongoose } from "@typegoose/typegoose";
export class SlashCommandSettings {
    /**
     * The original Command name used to retrieve it from the event handler
     */
    @prop({ required: true, sparse: true })
        internal_name!: string;
    /**
     * The Command Name overwrite
     */
    @prop({ required: false })
        name?: string;
    /**
     * The Command Description overwrite
     */
    @prop({ required: false })
        description?: string;
    /**
     * The Default Command Permission overwrite
     */
    @prop({ required: false })
        defaultPermission?: PermissionResolvable;
    /**
     * If the command should be completely removed from the slash command List
     */
    @prop({ required: false })
        disabled?: boolean;
    /**
     * All the command aliases (won't be shown general help)
     */
    @prop({ required: true, default: [], type: String })
        aliases!: mongoose.Types.Array<string>;
    /**
     * The Command permissions
     */
    @prop({ required: true, default: [], type: () => [SlashCommandPermission] })
        permissions!: mongoose.Types.DocumentArray<ArraySubDocumentType<SlashCommandPermission>>;

    public getPostablePermissions(): SlashCommandPermission[] {
        return this.permissions
            .map(x => { return { id: x.id, permission: x.permission, type: x.type } as SlashCommandPermission; });
    }
}

export const SlashCommandSettingsModel = getModelForClass(SlashCommandSettings, {
    schemaOptions: {
        autoCreate: false,
    },
});