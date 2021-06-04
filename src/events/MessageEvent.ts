import { ClientEventListener, ExecuteEvent } from "../../typings";
import { Client, ClientEvents, Collection } from "discord.js";
export const name = "message";

export const execute: ExecuteEvent<"message"> = async (client, message) => {

    /**
     * The cooldowns will be stored on a per User level
     */
    let cooldowns = client.cooldowns;

    var prefix = client.prefix;

    // no need to continue if message does not start with a Prefix
    if (!message.content.startsWith(prefix) || message.author.bot) return true;

    // Prepare command for execution
    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = (args.shift() as string).toLowerCase();
    const command = client.commands.get(commandName) || client.commands.find(cmd => (cmd.aliases != undefined) && cmd.aliases.includes(commandName));
    // if command was not found, just return to not interfere with other bots
    if (!command) return false;

    if (command.guildOnly && !message.guild) {
        await client.utils.errors.errorMessage(message, 'I can\'t execute that command inside DMs!');
        return false;
    }

    if (command.args && !args.length) {
        let reply = `You didn't provide any arguments, ${message.author}!`;

        if (command.usage) {
            reply += `\nThe proper usage would be: \`${prefix}${command.name} ${command.usage}\``;
        }
        await client.utils.errors.errorMessage(message, reply);
        return false;
    }

    // Check cooldowns
    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name)!;
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id)! + cooldownAmount;

        if (now < expirationTime && message.author.id != client.ownerID) {
            const timeLeft = (expirationTime - now) / 1000;
            await client.utils.errors.errorMessage(message, `please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command again.`);
            return false;
        }
    }

    // Execute Command
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    try {
        // let commandPromise = command.execute(client, message, args);
        // while(commandPromise instanceof Promise){
        //     commandPromise = await commandPromise
        // }
        command.execute(client, message, args);
    } catch (error) {
        console.error(error);
        message.reply(`Oh no, command ${commandName} had an error while executing :(\nI will look into this as soon as possible!`);
    }


    // if (commandName == "ping") {
    //     message.reply("Pong!");
    // }

    return true;
}
