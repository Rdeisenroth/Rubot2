import { MessageEmbed } from "discord.js";
import { Command, RunCommand } from "../../typings";

/**
 * The Command Definition
 */
const command: Command = {
    name: 'ping',
    description: 'Pong! Displays the api & bot latency.',
    aliases: ['latency', 'delay'],
    cooldown: 0,
    guildOnly: true,
    execute: async (client, message, args) => {
        var m = await message.channel.send("Pinging...");
        let ping = m.createdTimestamp - message.createdTimestamp
        let choices = ["Is this really my ping, it's so high...", "Is it okay? I cant look", "I hope it isnt bad"]
        let response = choices[Math.floor(Math.random() * choices.length)];
        let embed = new MessageEmbed()
            //.setAuthor(client.user.username, client.user.displayAvatarURL)
            .setTitle('__Response Times__')
            .setColor(message.guild?.me?.roles.highest.color || 0x7289da)
            .addField('Bot Latency:', ':hourglass_flowing_sand:' + ping + 'ms', true)
            .addField('API Latency:', ':hourglass_flowing_sand:' + Math.round(client.ws.ping) + 'ms', true)
        // .setThumbnail(client.user!.avatarURL()!);
        await m.edit('Pong.');
        message.channel.send(embed);
    }
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;
