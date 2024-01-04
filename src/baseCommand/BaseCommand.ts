import { CommandInteraction, Interaction, Message, BaseMessageOptions, CommandInteractionOption } from "discord.js";
import { handleInteractionError } from "@utils/handleError";
import BaseCommandOrSubcommandsHandler from "./BaseCommandOrSubcommandsHandler";
import { MissingOptionError, OptionRequirement } from "@types";

/**
 * The base class for all commands.
 */
export default abstract class BaseCommand extends BaseCommandOrSubcommandsHandler {
    /**
     * The command options.
     */
    public static options: OptionRequirement[] = []

    /**
     * Sends a message to the interaction channel.
     * 
     * If the interaction has sent previously, it will edit the previous message.
     * @param content The message content.
     * @returns The sent message.1
     */
    protected async send(content: BaseMessageOptions | string): Promise<Message> {
        try {
            const interaction = this.interaction as CommandInteraction
            const messageContent = typeof content === "string" ? { content } : content

            if (interaction.replied || interaction.deferred) {
                this.app.logger.debug(`Editing reply to interaction ${interaction.id}`)
                const sentContent = await interaction.editReply({ ...messageContent })
                this.app.logger.debug(`Finished edit reply to interaction ${interaction.id}`)
                return sentContent as Message
            } else {
                this.app.logger.debug(`Replying to interaction ${interaction.id}`)
                const sentContent = await interaction.reply({ ...messageContent, fetchReply: true })
                this.app.logger.debug(`Finished reply to interaction ${interaction.id}`)
                return sentContent as Message
            }
        } catch (error) {
            if (error instanceof Error) {
                handleInteractionError(error, this.interaction, this.app.logger)
            } else {
                this.app.logger.error(error)
            }
            throw error
        }
    }

    /**
     * Defers the reply to the interaction.
     */
    protected async defer(): Promise<void> {
        try {
            this.app.logger.debug(`Deferring reply to interaction ${this.interaction.id}`)
            const interaction = this.interaction as CommandInteraction
            await interaction.deferReply()
        } catch (error) {
            if (error instanceof Error) {
                handleInteractionError(error, this.interaction, this.app.logger)
            } else {
                this.app.logger.error(error)
            }
            throw error
        }
    }

    /**
     * Returns the value of the given option or the default value if the option is not present.
     * 
     * If the option is not present and there is no default value, throws an error.
     * @param option The option to get the value from.
     * @returns The option value.
     */
    protected async getOptionValue(option: OptionRequirement): Promise<string> {
        this.app.logger.debug(`Getting option value ${option.name} from interaction ${this.interaction.id}`)
        const interaction = this.interaction as CommandInteraction
        const optionValue = interaction.options.get(option.name)
        if (optionValue) {
            console.log(optionValue)
            return optionValue.value as string
        } else if (option.default) {
            return option.default as string
        }
        throw new MissingOptionError(option.name, interaction.commandName)
    }
}
