import mongoose from "mongoose";
import RoomSchema from "./rooms";
import { Channel } from "./text_channels";

export enum sessionRole {
    "participant" = "participant",
    "coach" = "coach",
    "supervisor" = "supervisor",
}

export interface Session extends Omit<Channel, "_id"> {
    /**
     * Whether the Session is currently active
     */
    active: boolean,
    /**
     * The User that the Session belongs to
     */
    user: string,
    /**
     * A Guild that the Session belongs to
     */
    guild?: string,
    /**
    * A Queue that is linked to the Session
    */
    queue?: mongoose.Types.ObjectId,
    /**
     *  The Role that the user plays
     */
    role: sessionRole,
    /**
     * The Start Timestamp
     */
    started_at: string,
    /**
     * The End Timestamp (Set when active==false)
     */
    ended_at?: string,
    /**
     * Only set to true if session had a clean exit
     */
    end_certain: boolean,
    /**
     * The Room IDs That Were Visited in the Session
     */
    rooms: string[],
}

const SessionSchema = new mongoose.Schema<SessionDocument, SessionModel, Session>({
    active: {
        type: Boolean,
        required: true,
    },
    user: {
        type: String,
        required: true,
    },
    guild: {
        type: String,
        required: false,
    },
    queue: {
        type: String,
        required: false,
    },
    role: {
        type: String,
        enum: Object.keys(sessionRole),
        required: true,
    },
    started_at: {
        type: String,
        required: false,
    },
    ended_at: {
        type: String,
        required: false,
    },
    end_certain: {
        type: Boolean,
        required: true,
    },
    rooms: [{
        type: String,
        required: true,
        default: [],
    }],
});

export interface SessionDocument extends Session, mongoose.Document {
    rooms: mongoose.Types.Array<string>,
    /**
     * Gets The Number of Rooms that were Visited in the Session
     */
    getRoomAmount(): number,
    /**
     * Gets The Number of Participants met in the Session (assuming the Chanels Lifetime is within the Session)
     */
    getParticipantAmount(): Promise<number>,
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SessionModel extends mongoose.Model<SessionDocument> {

}

// --Methods--

SessionSchema.method("getRoomAmount", function () {
    return this.rooms.length;
});

SessionSchema.method("getParticipantAmount", async function () {
    let amount = 0;
    for (const r of this.rooms) {
        const roomData = await RoomSchema.findById(r);
        if (roomData) {
            amount += (await roomData.getParticipants()).length;
        }
    }
    return amount;
});
// SessionSchema.method('getParticipants', function () {
//     return RoomSchema.f;
// });

// Default export
export default mongoose.model<SessionDocument, SessionModel>("Sessions", SessionSchema);