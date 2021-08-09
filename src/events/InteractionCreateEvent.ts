import { ClientEventListener, ExecuteEvent } from "../../typings";
import { Client, ClientEvents, Collection, Message } from "discord.js";
export const name = "interactionCreate";

export const execute: ExecuteEvent<"interactionCreate"> = async (client, interaction) => {

    /**
     * The cooldowns will be stored on a per User level
     */
    let cooldowns = client.cooldowns;

    // no need to continue if message is not a Command
    if (!interaction.isCommand()) return;

    const commandName = interaction.commandName;
    const command = client.commands.get(commandName) || client.commands.find(cmd => (cmd.aliases != undefined) && cmd.aliases.includes(commandName));
    // if command was not found, just return to not interfere with other bots
    if (!command) return;

    if (command.guildOnly && !interaction.guild) {
        await interaction.reply({ content: 'I can\'t execute that command inside DMs!' });
        return;
    }

    // Check cooldowns
    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name)!;
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;

        if (now < expirationTime && interaction.user.id != client.ownerID) {
            const timeLeft = (expirationTime - now) / 1000;
            await interaction.reply({ content: `please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command again.`, ephemeral: true });
            return;
        }
    }

    // Execute Command
    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
    try {
        // let commandPromise = command.execute(client, message, args);
        // while(commandPromise instanceof Promise){
        //     commandPromise = await commandPromise
        // }
        await command.execute(client, interaction, []); // We'll handle Args within the Command
    } catch (error) {
        console.error(error);
        interaction.reply({ content: `Oh no, command ${commandName} had an error while executing :(\nI will look into this as soon as possible!` });
    }
}
