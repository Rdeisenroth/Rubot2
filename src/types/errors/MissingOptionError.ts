export default class MissingOptionError extends Error {
    /** 
     * The missing option name.
     */
    public optionName: string;
    /**
     * The command name for which the option is missing.
     */
    public commandName: string;

    /**
     * Creates a new missing option error.
     * @param optionName The missing option name.
     * @param commandName The command name for which the option is missing.
     */
    constructor(optionName: string, commandName: string) {
        super(`Missing option "${optionName}" for command "${commandName}"`);
        this.optionName = optionName;
        this.commandName = commandName;
    }
}