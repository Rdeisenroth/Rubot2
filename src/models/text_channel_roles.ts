import { TextChannel } from "discord.js";
import mongoose from "mongoose";
import { Channel } from "./text_channels";

const ChannelRoleSchema = new mongoose.Schema<ChannelRoleDocument, ChannelRoleModel>({
    channel_type: {
        type: Number,
        enum: [0, 1,2,3,4,5,6,7],
        required: true
    },
    whitelist_user_groups: {
        type: [String],
        required: true
    },
    blacklist_user_groups: [{
        type: String,
        required: true
    }],
    managed: {
        type: Boolean,
        required: true,
    },
    owner: {
        type: String,
        required: false,
    },
    prefix: {
        type: String,
        required: false,
    },
    listen_for_commands: {
        type: String,
        required: true,
    },
    rage_channel: {
        type: String,
        required: false,
    },
    category: {
        type: String,
        required: false
    },
})

export enum ChannelPermissionType {
    /**
     * The Channel is completely invisible to the user and the user cannot type messages
     */
    INVISIBLE = 0,
    /**
     * The Channel is visible but the user cannot 
     */
    VISIBLE_NO_READ_WRITE = 0,
}

export interface ChannelRole {
    owner: string,
    manage_roles: string[],
    join_talk_roles: string[],
    visible_but_locked_roles: string[],
    invisible_locked_roles: string[],
    category_parent?: string,
    max_users?: number,
    /**
     * The Name of the Channel, use ${owner} and so on to create dynamic channel names
     */
    name?: string,
}

export interface ChannelRoleDocument extends ChannelRole, mongoose.Document {

}

export interface ChannelRoleModel extends mongoose.Model<ChannelRoleDocument> {

}

// Default export
export default ChannelRoleSchema;