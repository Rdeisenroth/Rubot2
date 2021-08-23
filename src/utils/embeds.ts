import { ColorResolvable, CommandInteraction, DMChannel, EmbedFieldData, Guild, GuildResolvable, Interaction, InteractionReplyOptions, Message, MessageEmbed, NewsChannel, ReplyMessageOptions, TextBasedChannels, TextChannel, ThreadChannel, UserResolvable, PartialDMChannel } from "discord.js";
import { APIMessage } from 'discord-api-types/v9';
import * as utils from './utils';
import { SimpleEmbedOptions } from "../../typings";

export async function SimpleEmbed(interaction: Message | CommandInteraction | DMChannel | TextChannel | NewsChannel | ThreadChannel, title: string, description: string): Promise<Message | null>;
export async function SimpleEmbed(interaction: Message | CommandInteraction | DMChannel | TextChannel | NewsChannel | ThreadChannel, options: SimpleEmbedOptions): Promise<Message | null>;

/**
 *Creates a message Embed and sends it in the Channel of the given Message
 *
 * @param interaction the message object to respond to
 * @param title the title of the embed
 * @param text The text for the Description of the embed
 * @param style The Style of the Embed
 * @param deleteinterval Automatically delete message after x seconds
 * @returns embedObject
 */
export async function SimpleEmbed(interaction: Message | CommandInteraction | DMChannel | TextChannel | NewsChannel | ThreadChannel, optionsortitle: SimpleEmbedOptions | string, description?: string) {//TODO Constructor for no repetitive embed creating
    if (!(
        interaction instanceof DMChannel ||
        interaction instanceof TextChannel ||
        interaction instanceof NewsChannel ||
        interaction instanceof ThreadChannel
    ) && !interaction.channel) {
        throw new Error("Embed Requires a Channel");
    }
    let embed = new MessageEmbed();
    if (!(interaction instanceof DMChannel)) {
        embed.setColor(interaction.guild?.me?.roles.highest.color ?? 0x7289da);
    } else {
        embed.setColor(0x7289da);
    }


    let options: SimpleEmbedOptions;
    if (typeof optionsortitle === "string") {
        options = { title: optionsortitle, text: description };
    } else {
        options = optionsortitle;
    }
    const { title, text, style, deleteinterval, empheral, fields } = options!;
    //embed.setAuthor(`${message.member.displayName}`, message.member.user.displayAvatarURL || null)
    embed.setTitle(title);
    embed.setDescription(`${text}`);
    if (fields) {
        for (let field of fields) {
            embed.addField(field.name, field.value, field.inline);
        }
    }
    let res: void | Message;
    if (interaction instanceof CommandInteraction) {
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ embeds: [embed] });
            res = void 0;
        } else {
            res = await interaction.reply({ embeds: [embed], ephemeral: empheral });
        }
    } else if (interaction instanceof Message) {
        res = await interaction.reply({ embeds: [embed] });
    } else {
        res = await interaction.send({ embeds: [embed] });
    }
    if (res instanceof Message) {
        let m = res;
        if (deleteinterval) {
            setTimeout(async () => { if (m.deletable) await m.delete() }, deleteinterval);
        }
        return m;
    } else if (interaction instanceof CommandInteraction) {
        if (!empheral) {
            let m = await interaction.fetchReply();
            if (deleteinterval) {
                setTimeout(() => interaction.deleteReply(), deleteinterval);
            }
            return m;
        }
    }
    // No Message was sent or empheral
    return null;
}

/**
 * creates a nice looking embed in the color of the current bot role
 *
 * @param {import ('./functions').UserRetrievable} [owner] the Owner of the Bot
 * @param {import ("discord.js").ColorResolvable | import ("discord.js").Guild} [guild] (optional) the guild to get the color from or A color Resolvable
 * @returns {import ("discord.js").RichEmbed} the RichEmbed
 */
export const EmbedTemplateWithAuthor = (owner: UserResolvable, guild: Guild | ColorResolvable) => {
    let embed = new MessageEmbed()
    let OwnerUser;
    let utils = require('./utils')
    try {
        if (owner) {
            OwnerUser = utils.functions.RetrieveUser(owner);
        }
    } catch (error) {
        //do nothing
        console.error(error)
    }
    embed.setColor((guild ? ((guild instanceof Guild) ? (guild.me!.roles.highest.color || 0x7289da) : guild) : 0x7289da))
        .setFooter(owner ? (OwnerUser instanceof require('discord.js').User) ? (`© 2020 ${OwnerUser.tag}`) : (`© 2020 ${owner}`) : `© 2020 Rubosplay#0815`, (owner && OwnerUser instanceof require('discord.js').User) ? OwnerUser.displayAvatarURL : null)
        .setTimestamp((Date.now()))
    return embed;
}

// /**
//  *Creates a setup Embed and sends it to the channel of the given Message
//  *
//  * @param {import ("discord.js").Message} message the message object to respond to
//  * @param {String} title the title of the embed
//  * @param {String} text The text for the Description of the embed
//  * @param {Number} [style] The Style of the Embed
//  * @param {Number} [deleteinterval] Automatically delete message after x seconds
//  * @returns {Promise<import ("discord.js").RichEmbed>} embedObject
//  */
// module.exports.SetupEmbed = async (message, text, style, category, categorydescription, entry, entrydescription, deleteinterval) => {//TODO Constructor for no repetitive embed creating
//     return new Promise((resolve, reject) => {
//         try {
//             utils.embeds.MessageEmbed(message, '__' + client.user.username + ' Setup__', text, style || null, deleteinterval || null, [category, categorydescription, `❯ ${entry}:` || null, entrydescription || null])
//         } catch (err) {
//             reject(err)
//         }
//     })
// }
// /**
//  *Creates a message Embed
//  *
//  * @param {import ("discord.js").Message} message the message object to respond to
//  * @param {String} title the title of the embed
//  * @param {String} text The text for the Description of the embed
//  * @param {Number} [deleteinterval] Automatically delete message after x seconds
//  * @returns {Promise<import ("discord.js").RichEmbed>} embedObject
//  */
// module.exports.CongratsEmbed = async (message, Ingamename, newHighest) => {//TODO Constructor for no repetitive embed creating
//     return new Promise((resolve, reject) => {
//         try {
//             let embed = new Discord.RichEmbed()
//             embed.setColor(message.guild.me.highestRole.color || 0x7289da)
//             //embed.setAuthor(`${message.member.displayName}`, message.member.user.displayAvatarURL || null)
//             embed.setTitle(`__new Rank__`)
//             embed.setDescription(`Congratulations for reaching the Rank of ${utils.ranks.HRN_to_Name}. Your rank roles will be updated.`)
//             if (deleteinterval) {
//                 resolve(message.channel.send(embed).then(m => m.delete(deleteinterval)))
//             } else {
//                 resolve(message.channel.send(embed))
//             }
//         } catch (err) {
//             reject(err)
//         }
//     })
// }