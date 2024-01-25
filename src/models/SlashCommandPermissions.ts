import { ApplicationCommandPermissionType } from "discord.js";
import { prop } from "@typegoose/typegoose";

export class SlashCommandPermission {
    /**
     * The User or Role ID
     */
    @prop({ required: true })
        id!: string;
    /**
     * The ID Type (Role or User)
     */
    @prop({ required: true, enum: ApplicationCommandPermissionType, default: ApplicationCommandPermissionType.User })
        type!: ApplicationCommandPermissionType;
    /**
     * Whether to permit or not permit the User Or Role
     */
    @prop({ required: true })
        permission!: boolean;
}
