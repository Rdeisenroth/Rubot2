// import mongoose from 'mongoose';
import mongoose from "mongoose";
import SessionSchema, { Session, SessionDocument, sessionRole } from "./sessions";

// TODO: User Settings, Other User Stuff

/**
 * A User from the Database
 */
export interface User {
    /**
     * The User ID provided by Discord
     */
    _id: string,
    /**
     * The Sessions
     */
    sessions: mongoose.Types.ObjectId[],
}

/**
 * A Schema For storing and Managing Guilds
 */
const UserSchema = new mongoose.Schema<UserDocument, UserModel, User>({
    _id: {
        type: String,
        required: true
    },
    sessions: [{
        type: mongoose.Types.ObjectId,
        required: true,
        default: []
    }],
});

export interface UserDocument extends User, Omit<mongoose.Document, "_id"> {
    sessions: mongoose.Types.Array<mongoose.Types.ObjectId>,
    // List getters or non model methods here
    /**
     * Checks if the User has Active Sessions
     */
    hasActiveSessions(): Promise<boolean>,
    /**
     * Gets all Sessions from a User
     */
    getSessions(): Promise<SessionDocument[]>,
    /**
     * Gets all Active Sessions from a User
     */
    getActiveSessions(): Promise<SessionDocument[]>,
    /**
     * Gets The Role a User had at the given Time
     * @param guildID The Guild That is associated With the Session
     * @param timestamp The Timestamp (defaults to Date.now())
     */
    getRole(guildID: string, timestamp?: number | undefined): Promise<sessionRole | null>,
}

export interface UserModel extends mongoose.Model<UserDocument> {
    // List Model methods here
}

// --Methods--

UserSchema.method('hasActiveSessions', async function () {
    if (await SessionSchema.findOne({ user: (this._id as string), active: true })) {
        return true;
    } else {
        return false;
    }
});

UserSchema.method('getSessions', async function () {
    return await SessionSchema.find({ user: (this._id as string) });
});

UserSchema.method('getActiveSessions', async function () {
    return await SessionSchema.find({ user: (this._id as string), active: true });
});


UserSchema.method('getRole', async function (guildID: string, timestamp?: number) {
    if (!timestamp) {
        timestamp = Date.now();
    }
    // Get Session(s) at Timestamp
    let sessions = await SessionSchema.find({ guild: guildID, user: (this._id as string), started_at: { $lte: timestamp.toString() }, $or: [{ ended_at: { $exists: false } }, { ended_at: { $gte: timestamp.toString() } }] });
    // We assume that there is at most One Session per guild at a time
    if (!sessions.length) {
        return null;
    } else {
        return sessions[0].role;
    }
});

// Default export
export default mongoose.model<UserDocument, UserModel>("Users", UserSchema);