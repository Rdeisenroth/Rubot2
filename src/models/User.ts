import { getModelForClass, prop, mongoose, Ref, DocumentType } from "@typegoose/typegoose";
import { Session, SessionRole } from "./Session";
import { DBRole } from "./BotRoles";
import { SessionModel } from "./Models";

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

    /**
     * Checks if the User has Active Sessions
     */
    public async hasActiveSessions(this: DocumentType<User>): Promise<boolean> {
        return !!(await SessionModel.findOne({ user: (this._id as string), active: true }));
    }

    /**
     * Returns the Active Sessions
     */
    public async getActiveSessions(this: DocumentType<User>): Promise<DocumentType<Session>[]> {
        return SessionModel.find({ user: (this._id as string), active: true });
    }

    /**
     * Retrieves the sessions associated with the user in a specific guild.
     * 
     * @param guildID - The ID of the guild.
     * @returns A promise that resolves to an array of sessions.
     */
    public async getSessions(this: DocumentType<User>, guildID: string): Promise<DocumentType<Session>[]> {
        return SessionModel.find({ user: (this._id as string), guild: guildID });
    }

    /**
     * Gets The Role a User had at the given Time
     * @param guildID The Guild That is associated With the Session
     * @param timestamp The Timestamp (defaults to Date.now())
     */
    public async getRole(this: DocumentType<User>, guildID: string, timestamp?: number): Promise<SessionRole | null> {
        if (!timestamp) {
            timestamp = Date.now();
        }
        // Get Session(s) at Timestamp
        const sessions = await SessionModel.find({ guild: guildID, user: (this._id as string), started_at: { $lte: timestamp.toString() }, $or: [{ ended_at: { $exists: false } }, { ended_at: { $gte: timestamp.toString() } }] });
        // We assume that there is at most One Session per guild at a time
        if (!sessions.length) {
            return null;
        } else {
            return sessions[0].role;
        }
    }
}