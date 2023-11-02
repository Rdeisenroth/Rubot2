import { stripIndents } from "common-tags";
import * as urban from "urban-dictionary";
import { ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "../../typings";

/**
 * The Command Definition
 */
const command: Command = {
    name: "urban",
    aliases: ["urb", "urbandictionary", "ud"],
    category: "Fun",
    description: "gets an urban dictionary definition",
    usage: "<search|random> (query)",
    options: [
        {
            name: "mode",
            description: "Select the Mode",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                {
                    name: "search",
                    value: "search",
                },
                {
                    name: "random",
                    value: "random",
                },
            ],
        },
        {
            name: "query",
            description: "The Search Query",
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    args: true,
    cooldown: 0,
    guildOnly: true,
    async execute(client, interaction, args) {
        //if (!message.channel.nsfw) return message.channel.send("Please run this command in a `NSFW` channel.");
        if (!interaction) {
            return;
        }
        let mode: string;
        let query: string | null | undefined;
        if (interaction instanceof ChatInputCommandInteraction) {
            mode = interaction.options.getString("mode", true);
            query = interaction.options.getString("query", false);
        } else {
            const tempMode = args.shift();
            if (!tempMode || !["search", "random"].includes(args.shift()!)) {
                return await client.utils.embeds.SimpleEmbed(interaction!, "Usage", `\`${client.config.get("prefix")}urban <search|random> (query)\``);
            }
            mode = tempMode;
            query = args.join(" ");
        }
        if (mode == "search" && !query) {
            return await client.utils.embeds.SimpleEmbed(interaction!, "Usage", `\`${client.config.get("prefix")}urban <search|random> (query)\``);
        }
        const image = "https://slack-files2.s3-us-west-2.amazonaws.com/avatars/2018-01-11/297387706245_85899a44216ce1604c93_512.jpg";
        const search = mode == "search" ? await urban.define(query!) : await urban.random();
        try {
            if (!search || !search.length) return interaction!.reply("No results found for this topic, sorry!");
            const { word, definition, example, thumbs_up, thumbs_down, permalink, author } = search[0];
            // if (interaction instanceof Message) {
            const embed = new EmbedBuilder()
                .setColor(3447003)
                .setAuthor({ name: `Urban Dictionary | ${word}`, iconURL: image })
                //.setThumbnail(image)
                .setDescription(stripIndents(`**Defintion:** ${definition || "No definition"}
                                **Example:** ${example || "No Example"}
                                **Upvote:** ${thumbs_up || 0}
                                **Downvote:** ${thumbs_down || 0}
                                **Link:** [link to ${word}](${permalink || "https://www.urbandictionary.com/"})`))
                .setTimestamp()
                .setFooter({ text: `Written by ${author || "unknown"}` });
            await interaction!.reply({ embeds: [embed] });
        } catch (e) {
            console.log(e);
            return interaction!.channel!.send("looks like i've broken! Try again");
        }
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;