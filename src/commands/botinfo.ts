import { EmbedBuilder } from "discord.js";
import { Command } from "../../typings";
import { version as djsversion } from "discord.js";
import * as moment from "moment";
import "moment-duration-format";

/**
 * The Command Definition
 */
const command: Command = {
    name: "botinfo",
    aliases: ["bi", "botstats", "bs", "info", "bot"],
    guildOnly: false,
    description: "Shows general information about the bot.",
    category: "Miscellaneous",
    async execute(client, interaction, args) {
        if (!interaction) {
            return;
        }
        const owner = client.users.cache.find(m => m.id == client.config.get("ownerID"));
        const embed = new EmbedBuilder();
        if (interaction.guild) {
            embed.setColor(interaction.guild.members.me!.roles.highest.color || 0x7289da);
        } else {
            embed.setColor(0x7289da);
        }
        embed.setTitle(`__${client.user!.username}'s Statistics__`)
            .setThumbnail(client.user!.displayAvatarURL())
            //.addField('❯ Uptime', duration(client.uptime), true)
            .addFields({ name: "❯ Uptime", value: moment.duration(client.uptime).format("d[d ]h[h ]m[m ]s[s]"), inline: true })
            .addFields({ name: "❯ Memory Usage", value: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`, inline: true })
            .addFields({ name: "❯ General Stats", value: `• Guilds: ${client.guilds.cache.size}\n• Channels: ${client.channels.cache.size}`, inline: true })
            .addFields({ name: "❯ Discord JS Version", value: `v${djsversion}`, inline: true })
            .addFields({ name: "❯ Node JS Version", value: `${process.version}`, inline: true })
            .addFields({ name: "❯ Bot Version", value: `v${client.config.get("version")}`, inline: true })
            .addFields({ name: "❯ Source", value: "[Github](https://github.com/Rdeisenroth/Rubot2)", inline: true })
            .setFooter({ text: `© 2021 ${owner?.tag}`, iconURL: owner?.displayAvatarURL() });
        return interaction.reply({ embeds: [embed] });
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;
