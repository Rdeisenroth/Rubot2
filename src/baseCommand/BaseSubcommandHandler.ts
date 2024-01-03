import { CommandInteraction, CommandInteractionOption } from "discord.js";
import { BaseCommandOrSubcommandHandler } from "./BaseCommandOrSubcommandHandler";
import { handleInteractionError } from "../utils/handleError";

/**
 * The base class for all subcommands.
 */
export class BaseSubcommandHandler extends BaseCommandOrSubcommandHandler {
    /**
     * The subcommands of this command.
     */
    public static subcommands: typeof BaseCommandOrSubcommandHandler[]

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
            const someClass = this.constructor as typeof BaseSubcommandHandler;
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
