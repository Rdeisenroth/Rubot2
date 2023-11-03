import { ApplicationCommandOptionType, Message } from "discord.js";
import { Command } from "../../../../typings";
import { GuildModel } from "../../../models/guilds";
import { QueueSpan } from "../../../models/queue_span";
import { WeekTimestamp } from "../../../models/week_timestamp";

const command: Command = {
    name: "get_schedules",
    description: "Gets the Times when the queue is automatically locked and unlocked (called Schedules or QueueSpans)",
    aliases: ["gs"],
    cooldown: 3000,
    guildOnly: true,
    options: [
        {
            name: "queue",
            description: "The name of the Queue to retrieve the schedules from",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    execute: async (client, interaction, args) => {
        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, "Slash Only Command", "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.");
            return;
        }
        await interaction.deferReply();
        const g = interaction.guild!;

        const guildData = (await GuildModel.findById(g.id))!;
        const queueName = interaction.options.getString("queue", true);
        const queueData = guildData.queues.find(x => x.name.toLowerCase() === queueName.toLowerCase());
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Server config", text: `:X: Error: Queue ${queueName} was not found.`, empheral: true });
        }

        let text = `Queue Scheduling is ${queueData.auto_lock ? "`enabled`" : "`disabled`"} for queue \`${queueName}\`.`;
        if (queueData.auto_lock) {
            text += `\n\nThe queue opens \`${Math.abs(queueData.openShift ?? 0)}ms\` ${(queueData.openShift ?? 0) <= 0 ? "earlier" : "later"} and closes \`${Math.abs(queueData.closeShift ?? 0)}ms\` ${(queueData.closeShift ?? 0) < 0 ? "earlier" : "later"} by default.`;
            text += "\n\nThe following times are scheduled for `unlocking` the queue:";
            text += "\n```";
            for (const schedule of queueData.opening_times.map(x => new QueueSpan(
                new WeekTimestamp(x.begin.weekday, x.begin.hour, x.begin.minute),
                new WeekTimestamp(x.end.weekday, x.end.hour, x.end.minute),
                x.openShift,
                x.closeShift,
                x.startDate,
                x.endDate,
            ))) {
                text += `\n❯ ${schedule.toString(true)}`;
            }
            text += "\n```";
        }

        return await client.utils.embeds.SimpleEmbed(
            interaction,
            {
                title: "Server Config",
                text,
                empheral: true,
            },
        );
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;