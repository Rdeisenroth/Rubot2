import { getModelForClass, prop } from "@typegoose/typegoose";

export enum Weekday {
    /**
     * Sonntag
     */
    SUNDAY = 0,
    /**
     * Montag
     */
    MONDAY = 1,
    /**
     * Dienstag
     */
    TUESDAY = 2,
    /**
     * Mittwoch
     */
    WEDNESDAY = 3,
    /**
     * Donnerstag
     */
    THURSDAY = 4,
    /**
     * Freitag
     */
    FRIDAY = 5,
    /**
     * Samstag
     */
    SATURDAY = 6
}
/**
 * A Timestamp of the queue
 */

export class WeekTimestamp {

    /**
     * The Day of the Week
     */
    @prop({ required: true, enum: Weekday })
        weekday!: Weekday;

    /**
     * The Hour of the Day
     */
    @prop({ required: true })
        hour!: number;
    /**
     * The Minute of the Hour
     */
    @prop({ required: true })
        minute!: number;

    /**
     * Creates a new WeekTimestamp
     * @param weekday The current day of the week
     * @param hour The current hour of the day
     * @param minute The current minute of the hour
     */
    constructor(
        /**
         * The Day of the Week
         */
        weekday: Weekday,
        /**
         * The Hour of the Day
         */
        hour: number,
        /**
         * The Minute of the Hour
         */
        minute: number,
    ) {
        this.weekday = weekday;
        this.hour = hour;
        this.minute = minute;
    }
    /**
     * returns the weektime in ms
     * @returns The WeekTime in ms
     */
    public getTime(): number {
        return this.minute * 1000 * 60 + this.hour * 1000 * 60 * 60 + this.weekday * 1000 * 60 * 60 * 24;
    }

    /**
     * Returns a Relative Weekdate
     * @param date The Date to convert
     * @returns The created WeekTimestamp
     */
    public static fromDate(date: Date) {
        return new WeekTimestamp(date.getDay(), date.getHours(), date.getMinutes());
    }

    /**
     * Returns a Relative Weekdate from a given Time in ms
     * @param number The Time elapsed since Sunday 00:00 in ms
     * @returns The created WeekTimestamp
     */
    public static fromNumber(number: number) {
        return new WeekTimestamp(Math.floor(number / 1000 / 60 / 60 / 24), Math.floor(number / 1000 / 60 / 60) % 24, Math.floor(number / 1000 / 60) % 60);
    }

    /**
     * Returns a string representation of the WeekTimestamp.
     * @param padWeekday Whether to pad the weekday to the length of the longest weekday name
     * @returns The WeekTimestamp as String
     * @example
     * ```ts
     * const weekTimestamp = new WeekTimestamp(Weekday.MONDAY, 12, 0);
     * console.log(weekTimestamp.toString()); // "MONDAY 12:00"
     * ```
     */
    public toString(padWeekday = false): string {
        const weekdayString = padWeekday ? Weekday[this.weekday].padEnd(Object.keys(Weekday).reduce((a, b) => a.length > b.length ? a : b).length, " ") : Weekday[this.weekday];
        return `${weekdayString} ${String(this.hour).padStart(2, "0")}:${String(this.minute).padStart(2, "0")}`;
    }

    /**
     * Creates a new WeekTimestamp from a given string
     * @param string The string to parse
     * @returns The created WeekTimestamp
     * @throws Throws an Error if the string is not a valid WeekTimestamp
     * @example
     * ```ts
     * const weekTimestamp = WeekTimestamp.fromString("Monday 12:00");
     * ```
     */
    public static fromString(str: string) {
        const regex = /^(?<weekday>\d+) (?<hour>\d+):(?<minute>\d+)$/;
        const match = regex.exec(str);
        if (!match) {
            throw new Error(`Invalid WeekTimestamp String: ${str}`);
        }
        return new WeekTimestamp(
            Weekday[match.groups!.weekday.toUpperCase() as keyof typeof Weekday],
            +match.groups!.hour,
            +match.groups!.minute,
        );
    }

    equals(other: WeekTimestamp): boolean {
        return this.weekday === other.weekday && this.hour === other.hour && this.minute === other.minute;
    }
}

export const WeekTimestampModel = getModelForClass(WeekTimestamp, {
    schemaOptions: {
        autoCreate: false,
    },
});