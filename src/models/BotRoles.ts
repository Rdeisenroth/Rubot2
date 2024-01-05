import { getModelForClass, prop } from "@typegoose/typegoose";

export enum InternalRoles {
    SERVER_OWNER = "server_owner",
    SERVER_ADMIN = "server_admin",
    TUTOR = "tutor",
    VERIFIED = "verified",
    ACTIVE_SESSION = "active_session",
    BOT_OWNER = "bot_owner",
    BOT_ADMIN = "bot_admin",
}

export const InternalGuildRoles = [InternalRoles.SERVER_OWNER, InternalRoles.SERVER_ADMIN, InternalRoles.TUTOR, InternalRoles.VERIFIED, InternalRoles.ACTIVE_SESSION];

export enum RoleScopes {
    GLOBAL = "global",
    SERVER = "server",
}

export class DBRole {
    /**
     * The internal Name of the Bot Role
     */
    @prop({ required: true, enum: InternalRoles })
        internal_name!: InternalRoles;
    /**
     * The Scope of the Role
     */
    @prop({ required: true, enum: RoleScopes })
        scope!: RoleScopes;
    /**
     * The ID of the server the role is in
     */
    @prop({ required: false, unique: true, sparse: true })
        server_id?: string;
    /**
     * The Discord Role ID
     */
    @prop({ required: false, unique: true, sparse: true })
        role_id?: string;
    /**
     * The Name of the role on the server (used for recovering the role if it gets deleted)
     */
    @prop({ required: false })
        server_role_name?: string;
}

/**
 * Roles that are valid for only one server
 */
export interface ServerRole extends DBRole {
    scope: RoleScopes.SERVER,
    server_id: string,
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

export const DBRoleModel = getModelForClass(DBRole, {
    schemaOptions: {
        autoCreate: false,
    },
});