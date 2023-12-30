import { CommandInteraction, Interaction, Message, BaseMessageOptions, ApplicationCommandOptionData, BaseApplicationCommandOptionsData } from "discord.js";
import { handleInteractionError } from "../utils/handleError";
import { Bot } from "../Bot";

/**
 * The base command class.
 */
export default abstract class BaseCommand {
    /** 
     * The command name.
     */
    public static name: string;
    /** 
     * The command description.
     */
    public static description: string;
    /**
     * The command options.
     */
    public static options: (ApplicationCommandOptionData & Pick<BaseApplicationCommandOptionsData, "required">)[]
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
    public abstract execute(...args: any[]): void;

    /**
     * Sends a message to the interaction channel.
     * 
     * If the interaction has sent previously, it will edit the previous message.
     * @param content The message content.
     * @returns The sent message.
     */
    protected async send(content: BaseMessageOptions | string): Promise<Message> {
        try {
            const interaction = this.interaction as CommandInteraction
            const messageContent = typeof content === "string" ? { content } : content

            if (interaction.replied)  {
                const sentContent = await interaction.editReply({ ...messageContent })
                return sentContent as Message
            } else {
                const sentContent = await interaction.reply({ ...messageContent, fetchReply: true })
                return sentContent as Message
            }
        } catch (error) {
            if (error instanceof Error) {
                handleInteractionError(error, this.interaction, this.client.logger)
            } else {
                this.client.logger.error(error)
            }
            throw error
        }
    }

}
