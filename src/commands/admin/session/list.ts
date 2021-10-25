import { EmbedFieldData, Message } from "discord.js";
import moment from "moment";
import { Command } from "../../../../typings";
import GuildSchema from "../../../models/guilds";
import UserSchema from "../../../models/users";
import SessionSchema from "../../../models/sessions";
import QueueSchema from "../../../models/queues";

const command: Command = {
    name: "list",
    description: "lists all currently active Coaching Sessions",
    aliases: ["i", "details", "d"],
    usage: "[channel resolvable]",
    cooldown: 3000,
    category: "Miscellaneous",
    guildOnly: true,
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
        const guildData = (await GuildSchema.findById(g.id))!;
        const sessions = await SessionSchema.find({ guild: g.id, active: true });
        const sortedSessions = sessions.sort((x, y) => (+x.started_at) - (+y.started_at));

        const fields: EmbedFieldData[] = [];
        for (const e of sortedSessions) {
            const member = await g.members.fetch(e.user);
            const participants = await e.getParticipantAmount();
            const queue = guildData.queues.id(e.queue);
            fields.push({
                name: member.displayName, value:
                    `-started_at: <t:${Math.round((+e.started_at) / 1000)}:f>`
                    + `\n-rooms: ${e.getRoomAmount()}`
                    + `\n-participants:${participants}`
                    + `\n-queue:${queue?.name}`,
            });
        }

        await client.utils.embeds.SimpleEmbed(interaction, {
            title: "Session Information",
            text: `${sortedSessions.length} Active Guild Sessions`,
            empheral: true,
            fields,
        });
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;