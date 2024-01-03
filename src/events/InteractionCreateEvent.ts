import { BaseEvent } from "../baseEvent";
import { ApplicationCommandOptionType, CommandInteractionOption, Interaction } from "discord.js";

export default class InteractionCreateEvent extends BaseEvent {
    public static name = "interactionCreate";

    public async execute(interaction: Interaction) {
        if (!interaction.isCommand()) return;

        const command = this.client.commands.find(command => command.name === interaction.commandName);

        if (!command) return;

        const options = this.getOptions(interaction.options.data);
        const commandName = interaction.commandName + (options.commandName.length > 0 ? ` ${options.commandName.map(option => option.name).join(" ")}` : "");
        this.client.logger.info(`${interaction.user.tag} executed command "${commandName}" with options ${JSON.stringify(options.options)}`);

        const concreteCommand = new command(interaction, this.client);

        try {
            await concreteCommand.execute();
            this.client.logger.info(`Command ${command.name} executed successfully.`);
        } catch (error) {
            this.client.logger.error(error);
            interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
        }
    }

    private getOptions(options: readonly CommandInteractionOption[] | undefined): {commandName: Option<any>[], options: Option<any>[]} {
        if (!options) return {commandName: [], options: []};
        const commandName: Option<any>[] = []
        const commandOptions: Option<any>[] = []
        
        options.forEach(option => {
            const optionData = {
                name: option.name,
                value: option.value,
                type: option.type,
            } 
            if (option.type == ApplicationCommandOptionType.Subcommand || option.type == ApplicationCommandOptionType.SubcommandGroup) {
                commandName.push(optionData)
            } else {
                commandOptions.push(optionData)
            }
            const nestedOptions = this.getOptions(option.options)
            commandName.push(...nestedOptions.commandName)
            commandOptions.push(...nestedOptions.options)
        })
        return {commandName: commandName, options: commandOptions}
    }
}

interface Option<T> {
    name: string;
    value: T
    type: ApplicationCommandOptionType;
}