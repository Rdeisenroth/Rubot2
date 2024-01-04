import { Application } from "@application";

/**
 * Base class for all events
 */
export default abstract class BaseEvent {
    /** 
     * Name of the event.
     */
    public static name: string;
    /** 
     * The app which received the event.
     */
    protected app: Application;

    /**
     * Creates a new instance of the BaseEvent class.
     * @param client The client instance.
     */
    constructor(app: Application) {
        this.app = app;
    }

    /**
     * Executes the event with the given arguments.
     * @param args The event arguments.
     */
    public abstract execute(...args: any[]): Promise<void>;
}