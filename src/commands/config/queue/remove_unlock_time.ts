import { ApplicationCommandOptionType, Message } from "discord.js";
import { Command } from "../../../../typings";
import { GuildModel } from "../../../models/guilds";
import { QueueSpan } from "../../../models/queue_span";
import { WeekTimestamp } from "../../../models/week_timestamp";

const command: Command = {
    name: "remove_unlock_time",
    description: "Removes a time span fron the Queue",
    aliases: ["rs"],
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
            name: "schedule",
            description: "The time span to remove from the queue",
            type: ApplicationCommandOptionType.String,
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
        const queueSpanString = interaction.options.getString("schedule", true);
        const queueData = guildData.queues.find(x => x.name.toLowerCase() === queueName.toLowerCase());
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Server config", text: `:x: Error: Queue ${queueName} was not found.`, empheral: true });
        }

        let queueSpan: QueueSpan;
        try {
            queueSpan = QueueSpan.fromString(queueSpanString);
        } catch (error: unknown) {
            client.utils.embeds.SimpleEmbed(interaction, "Server config", `:x: Error: could not parse the QueueSpan \`${queueSpanString}\`:\n ${(error as {message:unknown}).message}`);
            return;
        }
        const match = queueData.opening_times.find(x => {
            const span = new QueueSpan(
                new WeekTimestamp(x.begin.weekday, x.begin.hour, x.begin.minute),
                new WeekTimestamp(x.end.weekday, x.end.hour, x.end.minute),
                x.openShift,
                x.closeShift,
                x.startDate,
                x.endDate,
            );
            return span.equals(queueSpan);
        });
        if (!match) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Server config", text: `:x: Error: QueueSpan \`${queueSpanString}\` was not found.`, empheral: true });
        }
        queueData.opening_times.remove(match);
        await guildData.save();
        return await client.utils.embeds.SimpleEmbed(
            interaction,
            {
                title: "Server Config",
                text: `Queue span \`${queueSpan.toString()}\` was removed from the queue \`${queueName}\`.`,
                empheral: true,
            },
        );
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;