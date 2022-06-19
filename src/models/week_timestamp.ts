import mongoose, { Mongoose } from "mongoose";
import { Weekday, WeekTimestamp } from "../utils/general";


/**
 * A Schema of a Queue Entry
 */
const WeekTimestampSchema = new mongoose.Schema<WeekTimestampDocument, WeekTimestampModel, WeekTimestamp>({
    weekday: {
        type: mongoose.Schema.Types.Number,
        enum: [0, 1, 2, 3, 4, 5, 6],
        required: true,
    },
    hour: {
        type: mongoose.Schema.Types.Number,
        required: true,
    },
    minute: {
        type: mongoose.Schema.Types.Number,
        required: true,
    },
});

export interface WeekTimestampDocument extends WeekTimestamp, Omit<mongoose.Document<mongoose.Types.ObjectId>,"equals"> {
    // List getters or non model methods here
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WeekTimestampModel extends mongoose.Model<WeekTimestampDocument> {
    // List Model methods here
}

// Default export
export default WeekTimestampSchema;