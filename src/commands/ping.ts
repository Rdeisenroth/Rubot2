import { Interaction, Message, MessageEmbed } from "discord.js";
import { Command, RunCommand } from "../../typings";
import { APIMessage } from 'discord-api-types/v9';

/**
 * The Command Definition
 */
const command: Command = {
    name: 'ping',
    description: 'Pong! Displays the api & bot latency.',
    aliases: ['latency', 'delay'],
    cooldown: 0,
    guildOnly: true,
    execute: async (client, interaction, args) => {
        if (!interaction || !interaction.channel) {
            return;
        }
        // let choices = ["Is this really my ping, it's so high...", "Is it okay? I cant look", "I hope it isnt bad"]
        // let response = choices[Math.floor(Math.random() * choices.length)];
        let res = await interaction.reply({ content: "Pinging..." });
        let m: Message | APIMessage;
        if (interaction instanceof Interaction) {
            m = await interaction.fetchReply();
        } else {
            m = res as Message;
        }
        let messageTimestamp = m instanceof Message ? m.createdTimestamp : Date.parse(m.timestamp);
        let ping = messageTimestamp - interaction.createdTimestamp;
        let embed = new MessageEmbed()
            .setTitle('__Response Times__')
            .setColor(interaction!.guild?.me?.roles.highest.color || 0x7289da)
            .addField('Bot Latency:', ':hourglass_flowing_sand:' + ping + 'ms', true)
            .addField('API Latency:', ':hourglass_flowing_sand:' + Math.round(client.ws.ping) + 'ms', true)
        if (interaction instanceof Interaction) {
            await interaction.editReply({ content: "Pong.", embeds: [embed] });
        } else {
            await (m as Message).edit({ content: "Pong.", embeds: [embed] });
        }

    }
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;
