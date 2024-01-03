import { Interaction } from "discord.js";
import { Bot } from "../Bot";

/**
 * The base class for all commands and subcommands.
 */
export default class BaseCommandOrSubcommandsHandler {
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
     * The client who received the interaction.
     */
    protected client: Bot;

    /**
     * Creates a new instance of the BaseCommand class.
     * @param interaction The interaction.
     * @param client The client who received the interaction.
     */
    constructor(interaction: Interaction, client: Bot) {
        this.interaction = interaction;
        this.client = client;
    }

    /**
     * Executes the command with the given arguments.
     * @param args The command arguments.
     */
    public async execute(...args: any[]) {
        throw new Error("Method not implemented.");
    }
}
