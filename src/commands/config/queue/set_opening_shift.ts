import { ApplicationCommandOptionType, Message } from "discord.js";
import { Command } from "../../../../typings";
import { GuildModel } from "../../../models/guilds";

const command: Command = {
    name: "set_opening_shift",
    description: "Sets the default opening shift (time in ms to shift the unlocking of the queue)",
    aliases: ["sos"],
    cooldown: 3000,
    guildOnly: true,
    options: [
        {
            name: "queue",
            description: "The name of the Queue to add a schedule to",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "shift",
            description: "The shift in ms (unset = 0)",
            type: ApplicationCommandOptionType.Number,
            required: true,
        },
    ],
    execute: async (client, interaction, args) => {
        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, "Slash Only Command", "This Command is `Slash only` but you Called it with The `Prefix`. use the `slash Command` instead.");
            return;
        }
        await interaction.deferReply();
        const g = interaction.guild!;

        const guildData = (await GuildModel.findById(g.id))!;
        const queueName = interaction.options.getString("queue", true);
        const openShift = interaction.options.getNumber("shift", true);
        const queueData = guildData.queues.find(x => x.name.toLowerCase() === queueName.toLowerCase());
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Server config", text: `:x: Error: Queue ${queueName} was not found.`, empheral: true });
        }

        queueData.openShift = openShift;
        await guildData.save();
        return await client.utils.embeds.SimpleEmbed(
            interaction,
            {
                title: "Server Config",
                text: `The queue \`${queueName}\` now opens \`${Math.abs(queueData.openShift ?? 0)}ms\` ${(queueData.openShift ?? 0) <= 0 ? "earlier" : "later"} by default.`,
                empheral: true,
            },
        );
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;