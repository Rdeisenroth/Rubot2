import mongoose, { Mongoose } from "mongoose";
import { QueueSpan } from "../utils/general";
import WeekTimestampSchema from "./week_timestamp";


/**
 * A Schema of a Queue Entry
 */
const QueueSpanSchema = new mongoose.Schema<QueueSpanDocument, QueueSpanModel, QueueSpan>({
    begin: {
        type: WeekTimestampSchema,
        required: true,
    },
    end: {
        type: WeekTimestampSchema,
        required: true,
    },
    openShift: {
        type: mongoose.Schema.Types.Number,
        required: true,
        default: 0,
    },
    closeShift: {
        type: mongoose.Schema.Types.Number,
        required: true,
        default: 0,
    },
    startDate: {
        type: mongoose.Schema.Types.Date,
        required: false,
    },
    endDate: {
        type: mongoose.Schema.Types.Date,
        required: false,
    },
});

export interface QueueSpanDocument extends QueueSpan, mongoose.Document<mongoose.Types.ObjectId> {
    // List getters or non model methods here
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QueueSpanModel extends mongoose.Model<QueueSpanDocument> {
    // List Model methods here
}

// Default export
export default QueueSpanSchema;