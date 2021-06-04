import { MessageEmbed } from "discord.js";
import { RunCommand } from "../../typings";

export const name = 'ping';
export const description = 'Pong! Displays the api & bot latency.';
export const aliases = ['latency', 'delay'];
export const cooldown = 0;
export const guildOnly = true;

export const execute: RunCommand = async (client, message, args) => {
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
