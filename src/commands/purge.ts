import { Interaction, Message, MessageEmbed, PartialDMChannel, TextChannel } from "discord.js";
import { Command, RunCommand } from "../../typings";

/**
 * The Command Definition
 */
const command: Command = {
    name: 'purge',
    aliases: ['clear', 'cls', 'clr'],
    guildOnly: true,
    description: 'Deletes all messages in the channel.',
    category: "Moderation",
    options: [{
        name: 'amount',
        description: 'The Amount of Messages to Delete (default is 1)',
        type: "INTEGER",
        required: false,
    }],
    async execute(client, interaction, args) {
        if (!interaction) {
            return;
        }
        let amount: number;
        if (interaction instanceof Message) {
            if (!interaction.deletable) {
                await client.utils.embeds.SimpleEmbed(interaction, 'Error', 'Missing Permission to delete Message(s).');
                return;
            }
            await interaction.delete();
            let amountstr = args.shift();
            if (!amountstr) {
                amount = 1;
            } else {
                if (isNaN(+amountstr)) {
                    await interaction.channel.send(`${amountstr} is Not a Number.`);
                    return;
                }
                amount = +amountstr;
            }
        } else {
            amount = interaction.options.getInteger('amount') || 1;
        }
        let member = client.utils.general.getMember(interaction);
        if (!member) {
            return;
        }
        if (!member.permissions.has('ADMINISTRATOR')) {
            await interaction.reply(`**Error**, you don't have permission to execute this command, ${member}!`);
            return;
        }

        if (amount <= 0 || amount > 100) {
            return interaction.reply(`${amount} is not a valid Amount. Please use a Number between 1 and 100.`)
        }
        let channel = interaction.channel!;
        if (!("bulkDelete" in channel)) {
            await interaction.reply(`I Cannot execute This command in this Channel.`);
            return;
        }
        const fetched = await (interaction.channel! as TextChannel).bulkDelete(amount)
            .catch(async error => { await interaction.reply(`**Error:** ${error}`) });
        await client.utils.embeds.SimpleEmbed(interaction, 'Bulk Delete', `Deleted ${amount} Messages.`, undefined, 3000);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;