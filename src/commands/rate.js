/**
 * @type {import ("../../typings").Command}
 */
module.exports = {
    name: 'rate',
    aliases: ['judge', 'evaluate', 'r8'],
    usage: '<anything to rate>',
    guildOnly: false,
    description: 'Judges your stupid stuff as x/10 (11/10 is possible)',
    category: "Fun",
    async execute(client, message, args) {

        /**
         * The Possible Answers that get returned with weights to the Categories
         * @type {[String[],Number]}
         */
        var Answers = [['normal', 98], ['insanely good', 1], ['insanely bad', 1]];
        var shuffeled1;
        for (var i = 0; i < 1000; i++) {
            shuffeled1 = client.utils.general.shuffleArraywithWeights(Answers);
            //console.log(shuffleled1);
            if (i == 1000) console.log(">:(")
        }
        let chosennumber;
        switch (shuffeled1) {
            case "insanely good":
                chosennumber = client.utils.general.getRandomInt(11, 12);
                break;
            case "insanely bad":
                chosennumber = -1;
                break;
            default:
                chosennumber = client.utils.general.getRandomInt(0, 10);
                break;
        }
        // await message.reply(`I rate \`${chosennumber}/10\``);
        await client.utils.embeds.MessageEmbed(message, `__Rating System__`, `I rate \`${chosennumber}/10\``);
    },
};