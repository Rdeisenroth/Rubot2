import { BaseEvent } from "@baseEvent";
import { ApplicationCommandOptionType, CommandInteractionOption, Interaction } from "discord.js";

export default class InteractionCreateEvent extends BaseEvent {
    public static name = "interactionCreate";

    public async execute(interaction: Interaction) {
        if (!interaction.isCommand()) return;

        const command = this.app.commands.find(command => command.name === interaction.commandName);

        if (!command) return;

        const options = this.getOptions(interaction.options.data);
        const commandName = interaction.commandName + (options.commandName.length > 0 ? ` ${options.commandName.join(" ")}` : "");
        const optionsArray = Array.from(options.options.entries())
        const optionsString = `[${optionsArray.map(([key, value]) => `"${key}": "${value}"`).join(", ")}]`
        this.app.logger.info(`${interaction.user.tag} executed command "${commandName}" with options ${optionsString} in guild ${interaction.guild?.name} (id: ${interaction.guild?.id})`);

        const concreteCommand = new command(interaction, this.app);

        try {
            await concreteCommand.execute();
            this.app.logger.info(`Command ${command.name} executed successfully.`);
        } catch (error) {
            this.app.logger.error(error);
            interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
        }
    }

    private getOptions(options: readonly CommandInteractionOption[] | undefined): {commandName: Array<string>, options: Map<string, any>} {
        if (!options) return {commandName: [], options: new Map()};
        const commandName: Array<string> = []
        const commandOptions: Map<string, any> = new Map()
        
        options.forEach(option => {
            if (option.type == ApplicationCommandOptionType.Subcommand || option.type == ApplicationCommandOptionType.SubcommandGroup) {
                commandName.push(option.name)
            } else {
                commandOptions.set(option.name, option.value)
            }
            const nestedOptions = this.getOptions(option.options)
            commandName.push(...nestedOptions.commandName)
            nestedOptions.options.forEach((value, key) => { commandOptions.set(key, value) })
        })
        return {commandName: commandName, options: commandOptions}
    }
}

interface Option<T> {
    name: string;
    value: T
}