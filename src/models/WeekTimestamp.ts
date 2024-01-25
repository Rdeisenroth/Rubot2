import { prop } from "@typegoose/typegoose";

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
}