import { BaseEvent } from "../baseEvent";
import { Interaction } from "discord.js";

export default class InteractionCreateEvent extends BaseEvent {
    public static name = "interactionCreate";

    public async execute(interaction: Interaction) {
        if (!interaction.isCommand()) return;

        const command = this.client.commands.find(command => command.name === interaction.commandName);

        if (!command) return;

        this.client.logger.info(`${interaction.user.tag} executed command ${command.name} with options ${JSON.stringify(interaction.options)}`);

        const concreteCommand = new command(interaction, this.client);

        try {
            await concreteCommand.execute();
            this.client.logger.info(`Command ${command.name} executed successfully.`);
        } catch (error) {
            this.client.logger.error(error);
            interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
        }
    }
}