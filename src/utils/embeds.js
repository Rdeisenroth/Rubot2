const Discord = require("discord.js");
let utils = require('./utils')

/**
 *Creates a message Embed and sends it in the Channel of the given Message
 *
 * @param {import ("discord.js").Message} message the message object to respond to
 * @param {String} title the title of the embed
 * @param {String} text The text for the Description of the embed
 * @param {Number} [style] The Style of the Embed
 * @param {Number} [deleteinterval] Automatically delete message after x seconds
 * @returns {Promise<import ("discord.js").MessageEmbed>} embedObject
 */
module.exports.MessageEmbed = async (message, title, text, style, deleteinterval, fields) => {//TODO Constructor for no repetitive embed creating
    return new Promise((resolve, reject) => {
        try {
            let embed = new Discord.MessageEmbed()
            if (message && message.guild) {
                embed.setColor(message.guild.me.roles.highest.color)
            } else {
                embed.setColor(0x7289da)
            }

            //embed.setAuthor(`${message.member.displayName}`, message.member.user.displayAvatarURL || null)
            embed.setTitle(title)
            embed.setDescription(`${text}`)
            if (fields && utils.functions.isArray(fields) && utils.functions.isEven(fields.length)) {
                for (/** @type {Number}*/ var i = 0; i < fields.length - 2; i += 2) {
                    try {
                        embed.addField(fields[i], fields[i + 1])
                    } catch (err) {
                        return reject(err)
                    }

                }
            } else {
                //return reject('Invalid Fields Array')
            }
            if (deleteinterval) {
                resolve(message.channel.send(embed).then(m => m.delete(deleteinterval)))
            } else {
                resolve(message.channel.send(embed))
            }
        } catch (err) {
            reject(err)
        }
    })
}

/**
 * creates a nice looking embed in the color of the current bot role
 *
 * @param {import ('./functions').UserRetrievable} [owner] the Owner of the Bot
 * @param {import ("discord.js").ColorResolvable | import ("discord.js").Guild} [guild] (optional) the guild to get the color from or A color Resolvable
 * @returns {import ("discord.js").RichEmbed} the RichEmbed
 */
module.exports.EmbedTemplateWithAuthor = (owner, guild) => {
    try {
        let embed = new Discord.RichEmbed()
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
        embed.setColor((guild ? ((guild instanceof require('discord.js').Guild) ? (guild.me.highestRole.color || 0x7289da) : guild) : 0x7289da))
            .setFooter(owner ? (OwnerUser instanceof require('discord.js').User) ? (`© 2020 ${OwnerUser.tag}`) : (`© 2020 ${owner}`) : `© 2020 Rubosplay#0815`, (owner && OwnerUser instanceof require('discord.js').User) ? OwnerUser.displayAvatarURL : null)
            .setTimestamp((Date.now()))
        return embed;
    } catch (error) {
        thow(error)
    }
}

/**
 *Creates a setup Embed and sends it to the channel of the given Message
 *
 * @param {import ("discord.js").Message} message the message object to respond to
 * @param {String} title the title of the embed
 * @param {String} text The text for the Description of the embed
 * @param {Number} [style] The Style of the Embed
 * @param {Number} [deleteinterval] Automatically delete message after x seconds
 * @returns {Promise<import ("discord.js").RichEmbed>} embedObject
 */
module.exports.SetupEmbed = async (message, text, style, category, categorydescription, entry, entrydescription, deleteinterval) => {//TODO Constructor for no repetitive embed creating
    return new Promise((resolve, reject) => {
        try {
            utils.embeds.MessageEmbed(message, '__' + client.user.username + ' Setup__', text, style || null, deleteinterval || null, [category, categorydescription, `❯ ${entry}:` || null, entrydescription || null])
        } catch (err) {
            reject(err)
        }
    })
}
/**
 *Creates a message Embed
 *
 * @param {import ("discord.js").Message} message the message object to respond to
 * @param {String} title the title of the embed
 * @param {String} text The text for the Description of the embed
 * @param {Number} [deleteinterval] Automatically delete message after x seconds
 * @returns {Promise<import ("discord.js").RichEmbed>} embedObject
 */
module.exports.CongratsEmbed = async (message, Ingamename, newHighest) => {//TODO Constructor for no repetitive embed creating
    return new Promise((resolve, reject) => {
        try {
            let embed = new Discord.RichEmbed()
            embed.setColor(message.guild.me.highestRole.color || 0x7289da)
            //embed.setAuthor(`${message.member.displayName}`, message.member.user.displayAvatarURL || null)
            embed.setTitle(`__new Rank__`)
            embed.setDescription(`Congratulations for reaching the Rank of ${utils.ranks.HRN_to_Name}. Your rank roles will be updated.`)
            if (deleteinterval) {
                resolve(message.channel.send(embed).then(m => m.delete(deleteinterval)))
            } else {
                resolve(message.channel.send(embed))
            }
        } catch (err) {
            reject(err)
        }
    })
}