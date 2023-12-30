import { Bot } from "../Bot";

/**
 * Base class for all events
 */
export default abstract class BaseEvent {
    /** 
     * Name of the event.
     */
    public static name: string;
    /** 
     * Client instance.
     */
    protected client: Bot;

    /**
     * Creates a new instance of the BaseEvent class.
     * @param client The client instance.
     */
    constructor(client: Bot) {
        this.client = client;
    }

    /**
     * Executes the event with the given arguments.
     * @param args The event arguments.
     */
    public abstract execute(...args: any[]): void;
}