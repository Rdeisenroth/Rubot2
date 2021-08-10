import { Interaction, MessageEmbed } from "discord.js";
import { Command, RunCommand } from "../../typings";
import {version as djsversion} from 'discord.js';
import * as moment from 'moment';
import 'moment-duration-format';

/**
 * The Command Definition
 */
const command: Command = {
    name: 'botinfo',
    aliases: ['bi', 'botstats', 'bs', 'info', 'bot'],
    guildOnly: false,
    description: 'Shows general information about the bot.',
    category: "Miscellaneous",
    async execute(client, interaction, args) {
        if (!interaction) {
            return;
        }
        let owner = client.users.cache.find(m => m.id == client.ownerID);
        var embed = new MessageEmbed();
        if (interaction.guild) {
            embed.setColor(interaction.guild.me!.roles.highest.color || 0x7289da)
        } else {
            embed.setColor(0x7289da)
        }
        embed.setTitle(`__${client.user!.username}'s Statistics__`)
            .setThumbnail(client.user!.displayAvatarURL())
            //.addField('❯ Uptime', duration(client.uptime), true)
            .addField('❯ Uptime', moment.duration(client.uptime).format('d[d ]h[h ]m[m ]s[s]'), true)
            .addField('❯ Memory Usage', `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`, true)
            .addField('❯ General Stats', `• Guilds: ${client.guilds.cache.size}\n• Channels: ${client.channels.cache.size}`, true)
            .addField('❯ Discord JS Version', `v${djsversion}`, true)
            .addField('❯ Node JS Version', `${process.version}`, true)
            .addField('❯ Bot Version', `v${client.version}`, true)
            .addField('❯ Source', `[Github](https://github.com/Rdeisenroth/Rubot2)`, true)
            .setFooter(`© 2021 ${owner?.tag}`, owner?.displayAvatarURL())
        return interaction.reply({ embeds: [embed] });
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;