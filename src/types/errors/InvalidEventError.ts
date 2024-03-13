/**
 * Represents an error that occurs when an invalid event is encountered.
 */
export default class InvalidEventError extends Error {
    /**
     * The name of the event which is invalid.
     */
    public eventName: string

    /**
     * The valid events.
     */
    public validEvents: string[]

    /**
     * Creates a new InvalidEventError instance.
     * @param eventName The name of the event which is invalid.
     * @param validEvents The valid events.
     */
    constructor(eventName: string, validEvents: string[]) {
        super(`Invalid event: "${eventName}". Valid events: "${validEvents.join(`", "`)}".`)
        this.eventName = eventName
        this.validEvents = validEvents
    }
}