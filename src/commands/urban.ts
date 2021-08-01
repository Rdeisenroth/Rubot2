import { stripIndents } from"common-tags";
import * as urban from 'urban-dictionary';
import { MessageEmbed } from "discord.js";
import { Command, RunCommand } from "../../typings";

/**
 * The Command Definition
 */
const command: Command = {
    name: "urban",
    aliases: ["urb", "urbandictionary", "ud"],
    category: "Fun",
    description: "gets an urban dictionary definition",
    usage: "<search|random> (query)",
    args: true,
    cooldown: 0,
    guildOnly: true,
    async execute(client, message, args) {
        //if (!message.channel.nsfw) return message.channel.send("Please run this command in a `NSFW` channel.");
        if (!args || args.length<1|| !["search", "random"].includes(args.shift()!)) {
            return await client.utils.embeds.SimpleEmbed(message!, "Usage", `\`${client.prefix}urban <search|random> (query)\``);
        } 
        let image = "https://slack-files2.s3-us-west-2.amazonaws.com/avatars/2018-01-11/297387706245_85899a44216ce1604c93_512.jpg";
        let search = args.length ? await urban.define(args.join(" ")) : await urban.random();
        try {
            if (!search || !search.length) return message!.channel.send("No results found for this topic, sorry!");
            let { word, definition, example, thumbs_up, thumbs_down, permalink, author } = search[0];

                let embed = new MessageEmbed()
                    .setColor(3447003)
                    .setAuthor(`Urban Dictionary | ${word}`, image)
                    //.setThumbnail(image)
                    .setDescription(stripIndents(`**Defintion:** ${definition || "No definition"}
                            **Example:** ${example || "No Example"}
                            **Upvote:** ${thumbs_up || 0}
                            **Downvote:** ${thumbs_down || 0}
                            **Link:** [link to ${word}](${permalink || "https://www.urbandictionary.com/"})`))
                    .setTimestamp()
                    .setFooter(`Written by ${author || "unknown"}`);

                message!.channel.send(embed)
        } catch (e) {
            console.log(e)
            return message!.channel.send("looks like i've broken! Try again")
        }
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;