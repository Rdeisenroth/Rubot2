import { BaseEvent } from "../baseEvent";
import { Interaction } from "discord.js";

export default class InteractionCreateEvent extends BaseEvent {
    public static name = "interactionCreate";

    public execute(interaction: Interaction) {
        if (!interaction.isCommand()) return;

        const command = this.client.commands.find(command => command.name === interaction.commandName);

        if (!command) return;

        this.client.logger.info(`${interaction.user.tag} executed command ${command.name}`);

        const concreteCommand = new command(interaction, this.client);

        try {
            concreteCommand.execute();
        } catch (error) {
            console.error(error);
            interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
        }
    }
}