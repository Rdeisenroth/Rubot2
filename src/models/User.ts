import { getModelForClass, prop, mongoose, Ref } from "@typegoose/typegoose";
import { Session } from "./Session";
import { DBRole } from "./BotRoles";

/**
 * A User from the Database
 */
export class User {
    /**
     * The User ID provided by Discord
     */
    @prop({ required: true })
    _id!: string;
    // TODO: Some Link to Moodle Account
    /**
     * The Sessions
     */
    @prop({ required: true, ref: () => Session, default: [] })
    sessions!: mongoose.Types.Array<Ref<Session>>;
    /**
     * Die TU-ID
     */
    @prop({ required: false, unique: true, sparse: true })
    tu_id?: string;
    /**
     * Die Moodle-ID
     */
    @prop({ required: false, unique: true, sparse: true })
    moodle_id?: string;
    /**
     * Log all the Server Roles when a Member leaves
     */
    @prop({ required: true, default: [] })
    server_roles!: mongoose.Types.Array<string>;
    /**
     * The Roles that the User was assigned after verification
     */
    @prop({ required: true, default: [], ref: () => DBRole })
    token_roles!: mongoose.Types.Array<Ref<DBRole>>;
}

export const UserModel = getModelForClass(User, {
    schemaOptions: {
        autoCreate: true,
    },
});
