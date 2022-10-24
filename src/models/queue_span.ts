import mongoose, { Mongoose } from "mongoose";
import { WeekTimestamp, Weekday } from "../utils/general";
import WeekTimestampSchema from "./week_timestamp";

/**
 * A Queue Span - A Weekly Timespan with a start- and End Date that can be used to automate Events every week
 */
export class QueueSpan {
    /**
     * Creates a Queue Span (begin.getTime() must be smaller than end.getTime())
     * @param begin The Begin Timestamp
     * @param end The End Timestamp
     * @param openShift Shift the Opening by X millixeconds
     * @param closeShift Shift the Closing by X milliseconds
     * @param startDate limit the span to after this date
     * @param endDate limit the span to before this date
     */
    constructor(public begin: WeekTimestamp, public end: WeekTimestamp, public openShift = 0, public closeShift = 0, public startDate?: Date, public endDate?: Date) {

    }

    /**
     * Checks whether the cycle has started at a given Date (or now if no date was given)
     * @param date The Date to check
     * @returns `true`, if the cycle has started at the given date
     */
    public cycleHasStarted(date = new Date()) {
        return !this.startDate || date >= this.startDate;
    }

    /**
     * Checks whether the cycle has ended at a given Date (or now if no date was given)
     * @param date The Date to check
     * @returns `true`, if the cycle has ended at the given date
     */
    public cycleHasEnded(date = new Date()) {
        return this.endDate && date >= this.endDate;
    }

    /**
     * Checks whether the cycle is active at a given Date (or now if no date was given)
     * 
     * @param date The Date to check
     * @returns `true`, if the cycle is active at the given date
     */
    public cycleIsActive(date = new Date()) {
        return this.cycleHasStarted(date) && !this.cycleHasEnded(date);
    }

    /**
     * Returns the WeekTime of a given Date (or now if no date was given)
     * 
     * @param date The Date to check
     * @returns the WeekTime of the given Date
     */
    private getWeekTime(date = new Date()) {
        return WeekTimestamp.fromDate(date).getTime();
    }

    /**
     * returns The Shifted begin Timestamp
     * 
     * @returns The Shifted begin Timestamp
     */
    private actualBeginTime() {
        return this.begin.getTime() + this.openShift;
    }

    /**
     * returns The Shifted end Timestamp
     * 
     * @returns The Shifted end Timestamp
     */
    private actualEndTime() {
        return this.end.getTime() + this.closeShift;
    }

    /**
     * Checks whether the span is active at a given Date (or now if no date was given)
     * 
     * @param date The Date to check
     * @returns `true`, if the span is active at the given date
     */
    public isActive(date = new Date()) {
        const cur = this.getWeekTime(date);
        return this.cycleIsActive(date) && cur >= this.actualBeginTime() && cur <= this.actualEndTime();
    }

    /**
     * A String representation of the span
     * @returns A String representation of the current span
     */
    public toString(padWeekday = false) {
        return `${this.begin.toString(padWeekday)} - ${this.end.toString(padWeekday)}` + (this.startDate || this.endDate ? ` (${this.startDate ? `start: ${this.startDate.toLocaleString()}` : ""}${this.endDate ? `${this.startDate ? "," : ""} end: ${this.endDate.toLocaleString()}` : ""})` : "");
    }

    /**
     * Creates a Queue Span from a String
     * @param str the String to parse
     * @returns The created Queue Span
     * @throws An Error if the String could not be parsed
     * @example
     * ```ts
     * const span = QueueSpan.fromString("MONDAY 08:00 - WEDNESDAY 16:00");
     * ```
     * @example
     * ```ts
     * const span = QueueSpan.fromString("MONDAY 08:00 - WEDNESDAY 16:00 (start: 2020-01-01, end: 2020-01-02)");
     * ```
     */
    public static fromString(str: string) {
        // Name capturing group 1: weekday
        // Name capturing group 2: hour
        // Name capturing group 3: minute
        // Name capturing group 4: weekday 2
        // Name capturing group 5: hour 2
        // Name capturing group 6: minute 2
        const regex = /^(?<weekday>\w+)\s+(?<hour>\d{1,2})\s*:\s*(?<minute>\d{1,2})\s+-\s+(?<weekday2>\w+)\s+(?<hour2>\d{1,2})\s*:\s*(?<minute2>\d{1,2})(\s+\(start:\s+(?<startDate>\d{4}-\d{2}-\d{2})\s*,\s*end:\s+(?<endDate>\d{4}-\d{2}-\d{2})\))?$/;
        const match = regex.exec(str);
        if (!match) {
            throw new Error(`Invalid Queue Span String: ${str}`);
        }

        return new QueueSpan(
            new WeekTimestamp(
                Weekday[match.groups!.weekday.toUpperCase() as keyof typeof Weekday],
                +match.groups!.hour,
                +match.groups!.minute,
            ),
            new WeekTimestamp(
                Weekday[match.groups!.weekday2.toUpperCase() as keyof typeof Weekday],
                +match.groups!.hour2,
                +match.groups!.minute2,
            ),
            undefined,
            undefined,
            match.groups?.startDate ? new Date(match.groups!.startDate) : undefined,
            match.groups?.endDate ? new Date(match.groups!.endDate) : undefined,
        );
    }

    equals(other: QueueSpan) {
        return this.begin.equals(other.begin) && this.end.equals(other.end) && this.openShift === other.openShift && this.closeShift === other.closeShift && this.startDate === other.startDate && this.endDate === other.endDate;
    }
}

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

export interface QueueSpanDocument extends QueueSpan, Omit<mongoose.Document<mongoose.Types.ObjectId>,"equals"> {
    // List getters or non model methods here
}

QueueSpanSchema.loadClass(QueueSpan);

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface QueueSpanModel extends mongoose.Model<QueueSpanDocument> {
    // List Model methods here
}

// Default export
export default QueueSpanSchema;