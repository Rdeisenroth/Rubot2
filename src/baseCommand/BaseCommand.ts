import { CommandInteraction, Interaction, Message, BaseMessageOptions } from "discord.js";
import { handleInteractionError } from "../utils/handleError";
import { Bot } from "../Bot";
import OptionRequirement from "../types/OptionRequirement";

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
    public static options: OptionRequirement<any>[]
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
    public abstract execute(...args: any[]): Promise<void>;

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

            if (interaction.replied || interaction.deferred)  {
                this.client.logger.debug(`Editing reply to interaction ${interaction.id}`)
                const sentContent = await interaction.editReply({ ...messageContent })
                this.client.logger.debug(`Finished edit reply to interaction ${interaction.id}`)
                return sentContent as Message
            } else {
                this.client.logger.debug(`Replying to interaction ${interaction.id}`)
                const sentContent = await interaction.reply({ ...messageContent, fetchReply: true })
                this.client.logger.debug(`Finished reply to interaction ${interaction.id}`)
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

    protected async defer(): Promise<void> {
        try {
            this.client.logger.debug(`Deferring reply to interaction ${this.interaction.id}`)
            const interaction = this.interaction as CommandInteraction
            await interaction.deferReply()
        } catch (error) {
            if (error instanceof Error) {
                handleInteractionError(error, this.interaction, this.client.logger)
            } else {
                this.client.logger.error(error)
            }
            throw error
        }
    }

    protected async getOptionValue<T>(option: OptionRequirement<T>): Promise<T> {
        this.client.logger.debug(`Getting option value ${option.name} from interaction ${this.interaction.id}`)
        const interaction = this.interaction as CommandInteraction
        const optionValue = interaction.options.get(option.name)
        if (optionValue) {
            return optionValue.value as T
        }
        return option.default as T
    }
}
