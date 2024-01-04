import { CommandInteraction, CommandInteractionOption, Interaction } from "discord.js";
import { handleInteractionError } from "@utils/handleError";
import BaseCommandOrSubcommandsHandler from "./BaseCommandOrSubcommandsHandler";
import { Bot } from "../Bot";

/**
 * The base class for all subcommands.
 */
export default abstract class BaseSubcommandsHandler extends BaseCommandOrSubcommandsHandler {
    /**
     * The subcommands of this command.
     */
    public static subcommands: (new (interaction: Interaction, client: Bot) => BaseCommandOrSubcommandsHandler)[]

    public async execute() {
        try {
            const subcommandInteraction = (this.interaction as CommandInteraction & { resolved_subcommand?: CommandInteractionOption });
            if (!subcommandInteraction.resolved_subcommand) {
                subcommandInteraction.resolved_subcommand = subcommandInteraction.options.data[0];
            } else {
                subcommandInteraction.resolved_subcommand = subcommandInteraction.resolved_subcommand.options![0];
            }
            const subcommandName = subcommandInteraction.resolved_subcommand.name;
            this.client.logger.debug(`Executing subcommand ${subcommandName} from interaction ${this.interaction.id}`)
            const someClass = this.constructor as typeof BaseSubcommandsHandler;
            const subcommand = someClass.subcommands.find(subcommand => subcommand.name == subcommandName)!;
            const concreteSubcommand = new subcommand(this.interaction, this.client);
            await concreteSubcommand.execute();
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
