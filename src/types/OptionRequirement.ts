import { ApplicationCommandOptionType } from "discord.js";

/**
 * The option requirement interface used for the command options.
 */
export default interface OptionRequirement {
    /**
     * The option name.
     */
    name: string;
    /**
     * The option description.
     */
    description: string;
    /**
     * The option type.
     */
    type: ApplicationCommandOptionType
    /**
     * Whether the option is required.
     */
    required: boolean
    /**
     * The default value of the option.
     */
    default?: string | boolean | number
}
