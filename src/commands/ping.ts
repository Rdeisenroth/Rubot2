import { ChatInputCommandInteraction, Message, EmbedBuilder } from "discord.js";
import { Command } from "../../typings";

/**
 * The Command Definition
 */
const command: Command = {
    name: "ping",
    description: "Pong! Displays the api & bot latency.",
    aliases: ["latency", "delay"],
    cooldown: 0,
    guildOnly: true,
    execute: async (client, interaction, args) => {
        if (!interaction || !interaction.channel) {
            return;
        }
        // let choices = ["Is this really my ping, it's so high...", "Is it okay? I cant look", "I hope it isnt bad"]
        // let response = choices[Math.floor(Math.random() * choices.length)];
        const res = await interaction.reply({ content: "Pinging..." });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let m: any;
        if (interaction instanceof ChatInputCommandInteraction) {
            m = await interaction.fetchReply();
        } else {
            m = res as Message;
        }
        const messageTimestamp = m instanceof Message ? m.createdTimestamp : Date.parse(m.timestamp);
        const ping = messageTimestamp - interaction.createdTimestamp;
        const embed = new EmbedBuilder()
            .setTitle("__Response Times__")
            .setColor(interaction!.guild?.members.me?.roles.highest.color || 0x7289da)
            .addFields({ name:"Bot Latency:", value:":hourglass_flowing_sand:" + ping + "ms", inline:true })
            .addFields({ name:"API Latency:", value:":hourglass_flowing_sand:" + Math.round(client.ws.ping) + "ms", inline:true });
        if (interaction instanceof ChatInputCommandInteraction) {
            await interaction.editReply({ content: "Pong.", embeds: [embed] });
        } else {
            await (m as Message).edit({ content: "Pong.", embeds: [embed] });
        }

    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;
