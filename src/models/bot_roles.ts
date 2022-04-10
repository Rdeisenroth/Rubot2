import mongoose from "mongoose";
import GuildSchema, {GuildModel} from "./guilds";

export enum InternalRoles {
    SERVER_OWNER = "server_owner",
    SERVER_ADMIN = "server_admin",
    TUTOR = "tutor",
    VERIFIED = "verified",
    BOT_OWNER = "bot_owner",
    BOT_ADMIN = "bot_admin",
}

export enum RoleScopes {
    GLOBAL = "global",
    SERVER = "server",
}

export interface DBRole {
    /**
     * The internal Name of the Bot Role
     */
    internal_name: InternalRoles,
    /**
     * The Scope of the Role
     */
    scope: RoleScopes,
    /**
     * The ID of the server the role is in
     */
    server_id?: string,
    /**
     * The Discord Role ID
     */
    role_id?: string,
    /**
     * The Name of the role on the server (used for recovering the role if it gets deleted)
     */
    server_role_name?: string,
}

/**
 * Roles that are valid for only one server
 */
export interface ServerRole extends DBRole {
    /**
     * The Scope of the Role
     */
    scope: RoleScopes.SERVER,
    /**
     * The ID of the server the role is in
     */
    server_id: string,
    /**
     * The Discord Role ID
     */
    role_id?: string,
    /**
     * The Name of the role on the server (used for recovering the role if it gets deleted)
     */
    server_role_name?: string,
}

/**
 * Roles that are valid for only one server
 */
export interface BotRole extends DBRole {
    /**
     * The Scope of the Role
     */
    scope: RoleScopes.GLOBAL,
}

const DBRoleSchema = new mongoose.Schema<DBRoleDocument, DBRoleModel, DBRole>({
    internal_name: {
        type: String,
        required: true,
        enum: Object.values(InternalRoles),
    },
    scope: {
        type: String,
        required: true,
        enum: [RoleScopes.GLOBAL, RoleScopes.SERVER],
    },
    server_id: {
        type: String,
        required: true,
        unique: true,
        sparse: true,
    },
    role_id: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
    },
    server_role_name: {
        type: String,
        required: false,
    },
});

export interface DBRoleDocument extends DBRole, mongoose.Document<mongoose.Types.ObjectId> {
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DBRoleModel extends mongoose.Model<DBRoleDocument> {

}

// Default export
export default DBRoleSchema;