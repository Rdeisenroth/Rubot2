import { getModelForClass, prop, mongoose } from "@typegoose/typegoose";

export enum SessionRole {
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
    @prop({ required: true, enum: SessionRole })
        role!: SessionRole;
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
}

export const SessionModel = getModelForClass(Session, {
    schemaOptions: {
        autoCreate: true,
    },
});
