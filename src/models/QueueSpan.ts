import { prop } from "@typegoose/typegoose";
import { WeekTimestamp } from "./WeekTimestamp";

/**
 * A Queue Span - A Weekly Timespan with a start- and End Date that can be used to automate Events every week
 */
export class QueueSpan {
    /**
     * The Begin Timestamp
     */
    @prop({ required: true, type: WeekTimestamp })
        begin!: WeekTimestamp;

    /**
     * The End Timestamp
     */
    @prop({ required: true, type: WeekTimestamp })
        end!: WeekTimestamp;

    /**
     * Shift the Opening by X millixeconds
     * @default 0
     */
    @prop({ required: true, default: 0 })
        openShift!: number;

    /**
     * Shift the Closing by X milliseconds
     * @default 0
     */
    @prop({ required: true, default: 0 })
        closeShift!: number;

    /**
     * limit the span to after this date
     */
    @prop({ required: false })
        startDate?: Date;

    /**
     * limit the span to before this date
     * @default 0
     */
    @prop({ required: false })
        endDate?: Date;
}