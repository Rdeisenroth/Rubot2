import { RoomModel } from "./rooms";
import { DocumentType, getModelForClass, prop, mongoose } from "@typegoose/typegoose";
export enum sessionRole {
    "participant" = "participant",
    "coach" = "coach",
    "supervisor" = "supervisor",
}

export class Session {
    /**
     * Whether the Session is currently active
     */
    @prop({ required: true })
        active!: boolean;
    /**
     * The User that the Session belongs to
     */
    @prop({ required: true })
        user!: string;
    /**
     * A Guild that the Session belongs to
     */
    @prop()
        guild?: string;
    /**
    * A Queue that is linked to the Session
    */
    @prop()
        queue?: mongoose.Types.ObjectId;
    /**
     *  The Role that the user plays
     */
    @prop({ required: true, enum: sessionRole })
        role!: sessionRole;
    /**
     * The Start Timestamp
     */
    @prop()
        started_at?: string;
    /**
     * The End Timestamp (Set when active==false)
     */
    @prop()
        ended_at?: string;
    /**
     * Only set to true if session had a clean exit
     */
    @prop({ required: true })
        end_certain!: boolean;
    /**
     * The Room IDs That Were Visited in the Session
     */
    @prop({ required: true, type: () => [String], default: [] })
        rooms!: mongoose.Types.Array<string>;

    /**
     * Gets The Number of Rooms that were Visited in the Session
     */
    public getRoomAmount(this: DocumentType<Session>): number {
        return this.rooms.length;
    }

    /**
     * Gets The Number of Participants met in the Session (assuming the Chanels Lifetime is within the Session)
     */
    public async getParticipantAmount(this: DocumentType<Session>): Promise<number> {
        let amount = 0;
        for (const r of this.rooms) {
            const roomData = await RoomModel.findById(r);
            if (roomData) {
                amount += (await roomData.getParticipants()).length;
            }
        }
        return amount;
    }
}

export const SessionModel = getModelForClass(Session, {
    schemaOptions: {
        autoCreate: true,
    },
});