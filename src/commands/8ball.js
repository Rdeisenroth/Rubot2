/**
 * @type {import ("../../typings").Command}
 */
module.exports = {
    name: '8ball',
    aliases: ['8b', 'answermyquestion', 'amq'],
    guildOnly: false,
    description: 'Gives a random Answer to your stupid questions',
    category: "Fun",
    async execute(client, message, args) {

        /**
         * The Possible Answers that get returned with weights to the Categories
         * @type {[String[],Number]}
         */
        var Answers = [[["It is certain.",
            "As I see it, yes.",
            "It is decidedly so.",
            "Most likely.",
            "Without a doubt.",
            "Outlook good.",
            "Yes - definitely.",
            "Yes.",
            "You may rely on it.",
            "Signs point to yes."], 4],
        [["Reply hazy, try again.",
            "Ask again later.",
            "Better not tell you now.",
            "Concentrate and ask again."], 2],
        [["Don't count on it.",
            "My reply is no.",
            "My sources say no.",
            "Outlook not so good.",
            "Very doubtful."], 4]];
        var eightballemoji = await client.emojis.cache.get("668488605068558337");
        var shuffleled1;
        for (var i = 0; i < 1000; i++) {
            shuffleled1 = client.utils.general.shuffleArraywithWeights(Answers);
            //console.log(shuffleled1);
            if (i == 1000) console.log(">:(")
        }
        await client.utils.embeds.MessageEmbed(message, `__8 Ball__`, `${eightballemoji} ${await client.utils.general.shuffleArray(shuffleled1)}`)
    },
};