import { MessageEmbed } from "discord.js";
import moment from "moment";
import { ButtonInteraction } from "../../../../typings";
import GuildSchema, { Guild, GuildDocument } from "../../../models/guilds";
import { Queue, QueueDocument } from "../../../models/queues";

const command: ButtonInteraction = {
    customID: "queue_leave",
    description: "leave the current queue",
    cooldown: 2000,
    execute: async (client, interaction) => {
        const guilds = await GuildSchema.find();
        let g: GuildDocument | undefined;
        let queue: Queue | undefined;
        for (g of guilds) {
            if (!g.queues) {
                continue;
            }
            queue = g.queues.find(x => x.entries.some(x => x.discord_id === interaction.user.id));
            if (!queue) {
                continue;
            }
            break;
        }
        if (!g || !queue) {
            await interaction.update({ components: [] });
            return;
        }
        // Leave the Queue
        const entry = queue.entries.splice(queue.entries.findIndex(x => x.discord_id === interaction.user.id), 1)[0];
        await g.save();
        try {
            const member = client.guilds.cache.get(g._id)?.members.cache.get(interaction.user.id);
            await member?.voice.disconnect();
        } catch (error) {
            console.log(error);
        }
        if (queue.leave_message) {
            try {
                const replacements = {
                    "limit": queue.limit,
                    "member_id": interaction.user.id,
                    "user": interaction.user.id,
                    "name": queue.name,
                    "description": queue.description,
                    "eta": "null",
                    "timeout": queue.disconnect_timeout,
                    "pos": (queue as QueueDocument).getPosition(entry.discord_id) + 1,
                    "total": queue.entries.length,
                    "time_spent": moment.duration(Date.now() - (+entry.joinedAt)).format("d[d ]h[h ]m[m ]s.S[s]"),
                };
                // Interpolate String
                const leave_message = client.utils.general.interpolateString(queue.leave_message, replacements);
                await interaction.update({ embeds: [new MessageEmbed({ title: "Queue System", description: leave_message, color: interaction.guild?.me?.roles.highest.color || 0x7289da })], components: [] });
            } catch (error) {
                console.log(error);
            }
        } else {
            await interaction.update({ embeds: [new MessageEmbed({ title: "Queue System", description: "You left the Queue.", color: client.guilds.cache.get((g as Guild & { _id: string })._id)?.me?.roles.highest.color || 0x7289da })], components: [] });
        }
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;