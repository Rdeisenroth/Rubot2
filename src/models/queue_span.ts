import { WeekTimestamp, Weekday } from "./week_timestamp";
import { getModelForClass, prop } from "@typegoose/typegoose";

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

    /**
     * Creates a Queue Span (begin.getTime() must be smaller than end.getTime())
     * @param begin The Begin Timestamp
     * @param end The End Timestamp
     * @param openShift Shift the Opening by X millixeconds
     * @param closeShift Shift the Closing by X milliseconds
     * @param startDate limit the span to after this date
     * @param endDate limit the span to before this date
     */
    constructor(begin: WeekTimestamp, end: WeekTimestamp, openShift = 0, closeShift = 0, startDate?: Date, endDate?: Date) {
        this.begin = begin;
        this.end = end;
        this.openShift = openShift;
        this.closeShift = closeShift;
        this.startDate = startDate;
        this.endDate = endDate;
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

export const QueueSpanModel = getModelForClass(QueueSpan, {
    schemaOptions: {
        autoCreate: false,
    },
});