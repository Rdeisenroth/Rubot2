import { Message, MessageEmbed } from "discord.js";
import { Command } from "../../../typings";
import { version as djsversion } from "discord.js";
import * as moment from "moment";
import "moment-duration-format";

/**
 * The Command Definition
 */
const command: Command = {
    name: "serverstats",
    aliases: ["ss"],
    guildOnly: false,
    description: "Shows general information about the bot.",
    category: "Miscellaneous",
    async execute(client, interaction, args) {
        if (!interaction || !interaction.guild) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, "Slash Only Command", "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.");
            return;
        }
        await interaction.deferReply();
        await interaction.guild.roles.fetch();
        await interaction.guild.members.fetch();
        const verifiedRole = interaction.guild.roles.cache.find(x => x.name.toLowerCase() === "verified");
        await client.utils.embeds.SimpleEmbed(interaction, {
            title: "Server Stats", text: "Server Information", empheral: false, fields: [
                { name: "❯ Members: ", value: `${interaction.guild.memberCount}`, inline: true },
                { name: "❯ Verified Members: ", value: `${verifiedRole?.members.size ?? 0}`, inline: true },
                { name: "❯ Unverified Members: ", value: `${interaction.guild.memberCount - (verifiedRole?.members.size ?? 0)}`, inline: true },
                { name: "❯ Channels: ", value: `${interaction.guild.channels.cache.size}`, inline: true },
                { name: "❯ Owner: ", value: `<@${interaction.guild.ownerId}>`, inline: true },
                { name: "❯ Created at: ", value: `<t:${Math.round(interaction.guild.createdAt.getTime() / 1000)}:f>`, inline: true },
            ],
        });
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;