import { ExecuteEvent } from "../../typings";
import { ChatInputCommandInteraction, Collection } from "discord.js";
export const name = "interactionCreate";
import { GuildModel } from "../models/guilds";

export const execute: ExecuteEvent<"interactionCreate"> = async (client, interaction) => {


    // no need to continue if message is not a Command
    if (interaction.isCommand()) {
        /**
         * The cooldowns will be stored on a per User level
         */
        const cooldowns = client.cooldowns;
        const commandName = interaction.commandName;
        let actualCommandName = commandName;
        if (interaction.guild) {
            const g = interaction.guild;
            const guildData = (await GuildModel.findById(g.id))!;
            actualCommandName = guildData.guild_settings.getCommandByGuildName(commandName)?.internal_name ?? commandName;
        }
        const command = client.commands.get(actualCommandName) || client.commands.find(cmd => (cmd.aliases != undefined) && cmd.aliases.includes(actualCommandName));
        // if command was not found, just return to not interfere with other bots
        if (!command) return await interaction.reply({ content: "Command was not Found." });

        if (command.guildOnly && !interaction.guild) {
            await interaction.reply({ content: "I can't execute that command inside DMs!" });
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

            if (now < expirationTime && interaction.user.id != client.config.get("ownerID")) {
                const timeLeft = (expirationTime - now) / 1000;
                await interaction.reply({ content: `please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command again.`, ephemeral: true });
                return;
            }
        }

        // Execute Command
        try {
            console.log(`${interaction.user.tag} Executed Command ${commandName}:\n${JSON.stringify(interaction.options.data)}`);
        } catch (error) {
            console.error(error);
        }
        // let optionString = interaction.options.data.map((x:CommandInteractionOption) => {
        //     if(x.type === "SUB_COMMAND_GROUP")
        // });
        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
        try {
            // let commandPromise = command.execute(client, message, args);
            // while(commandPromise instanceof Promise){
            //     commandPromise = await commandPromise
            // }
            await command.execute(client, interaction as ChatInputCommandInteraction, []); // We'll handle Args within the Command
        } catch (error) {
            console.error(error);
            interaction.reply({ content: `Oh no, command ${commandName} had an error while executing :(\nI will look into this as soon as possible!` });
        }
    } else if (interaction.isButton()) {
        const customID = interaction.customId;
        const interactionFile = client.componentInteractions.buttons.get(customID) || client.componentInteractions.buttons.find(i => (i.aliases != undefined) && i.aliases.includes(customID));
        // if command was not found, just return to not interfere with other bots
        if (!interactionFile) return;
        try {
            // let commandPromise = command.execute(client, message, args);
            // while(commandPromise instanceof Promise){
            //     commandPromise = await commandPromise
            // }
            await interactionFile.execute(client, interaction); // We'll handle Args within the Command
        } catch (error) {
            console.error(error);
            interaction.reply({ content: `Oh no, Button ${customID} had an error while executing :(\nI will look into this as soon as possible!` });
        }
    }
};
