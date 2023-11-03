import { ApplicationCommandOptionType, Message } from "discord.js";
import { Command } from "../../../../typings";
import { GuildModel } from "../../../models/guilds";

const command: Command = {
    name: "set_text_channel",
    description: "Set a text channel for bot messages of the queue",
    aliases: ["stc"],
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
            name: "channel",
            description: "A Text channel",
            type: ApplicationCommandOptionType.Channel,
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
        const queueChannel = interaction.options.getChannel("channel", true);
        const queueData = guildData.queues.find(x => x.name.toLowerCase() === queueName.toLowerCase());
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Server config", text: `:x: Error: Queue ${queueName} was not found.`, empheral: true });
        }

        queueData.text_channel = queueChannel.id;
        await guildData.save();
        return await client.utils.embeds.SimpleEmbed(
            interaction,
            {
                title: "Server Config",
                text: `Text channel \`${queueChannel.name}\` was set for the queue \`${queueName}\`.`,
                empheral: false,
            },
        );
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;