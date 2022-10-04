import { ApplicationCommandOptionType, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../../typings";

/**
 * The Command Definition
 */
const command: Command = {
    name: "8ball",
    aliases: ["8b", "answermyquestion", "amq"],
    guildOnly: false,
    description: "Gives a random Answer to your stupid questions",
    category: "Fun",
    options: [{
        name: "query",
        description: "The Query String",
        type: ApplicationCommandOptionType.String,
        required: false,
    }],
    async execute(client, interaction, args) {

        /**
         * The Possible Answers that get returned with weights to the Categories
         */
        const Answers: [string[], number][] = [[["It is certain.",
            "As I see it, yes.",
            "It is decidedly so.",
            "Most likely.",
            "Without a doubt.",
            "Outlook good.",
            "Yes - definitely.",
            "Yes.",
            "You may rely on it.",
            "Signs point to yes.",
            "Undoubtably.",
            "Absolutely.",
            "Obviously yes."], 4],
        [["Reply hazy, try again.",
            "Ask again later.",
            "Better not tell you now.",
            "Concentrate and ask again.",
            "Who knows...",
            "Why would i tell you?",
            "Maybe i'll tell you if you ask again *nicer*."], 2],
        [["Don't count on it.",
            "My reply is no.",
            "My sources say no.",
            "Outlook not so good.",
            "Very doubtful.",
            "Absolutely not.",
            "No. No, Absolutely not."], 4]];
        const eightballemoji = await client.emojis.cache.get("668488605068558337");
        const answerDirection = client.utils.general.getRandomEntryWithWeights(Answers);
        const query = (interaction instanceof ChatInputCommandInteraction) ? interaction.options.getString("query", false) : args.join(" ");
        await client.utils.embeds.SimpleEmbed(interaction!, "__8 Ball__", `${interaction instanceof ChatInputCommandInteraction && query ? "> " + query + "\n" : ""}${eightballemoji} ${await client.utils.general.getRandomEntry(answerDirection)}`);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;