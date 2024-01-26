import { OverwriteData, PermissionResolvable, Snowflake } from "discord.js";
import { prop } from "@typegoose/typegoose";

export class PermissionOverwriteData implements OverwriteData {
    @prop({ required: true, type: String })
        id!: Snowflake;
    @prop({ required: true, type: String, default: [] })
        allow?: PermissionResolvable[];
    @prop({ required: true, type: String, default: [] })
        deny?: PermissionResolvable[];
}