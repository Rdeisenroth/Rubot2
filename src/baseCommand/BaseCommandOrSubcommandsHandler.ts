import { Application } from "@application";
import { Interaction } from "discord.js";


/**
 * The base class for all commands and subcommands.
 */
export default abstract class BaseCommandOrSubcommandsHandler {
    /** 
     * The command name.
     */
    public static name: string;
    /** 
     * The command description.
     */
    public static description: string;
    /** 
     * The interaction.
     */
    protected interaction: Interaction;
    /** 
     * The app which received the interaction.
     */
    protected app: Application;

    /**
     * Creates a new instance of the BaseCommand class.
     * @param interaction The interaction.
     * @param app The app which received the interaction.
     */
    constructor(interaction: Interaction, app: Application) {
        this.interaction = interaction;
        this.app = app;
    }

    /**
     * Executes the command with the given arguments.
     * @param args The command arguments.
     */
    public abstract execute(...args: any[]): Promise<void>;
}
