import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import moment from "moment";
import { ButtonInteraction } from "../../../../typings";
import GuildSchema, { Guild, GuildDocument } from "../../../models/guilds";
import { Queue, QueueDocument } from "../../../models/queues";

const command: ButtonInteraction = {
    customID: "queue_refresh",
    description: "refresh the current queue info",
    // cooldown: 30000,
    execute: async (client, interaction) => {
        const guilds = await GuildSchema.find();
        let g: GuildDocument | undefined;
        let queue: QueueDocument | undefined;
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

        const entry = queue.entries.find(x => x.discord_id === interaction.user.id)!;
        if (queue.join_message) {
            try {
                const replacements = {
                    "limit": queue.limit,
                    "member_id": interaction.user.id,
                    "user": interaction.user.id,
                    "name": queue.name,
                    "description": queue.description,
                    "eta": "null",
                    "timeout": queue.disconnect_timeout,
                    "pos": queue.getPosition(entry.discord_id) + 1,
                    "total": queue.entries.length,
                    "time_spent": moment.duration(Date.now() - (+entry.joinedAt)).format("d[d ]h[h ]m[m ]s.S[s]"),
                };
                // Interpolate String
                const join_message = client.utils.general.interpolateString(queue.join_message, replacements);
                await interaction.update(
                    {
                        embeds:
                            [
                                new EmbedBuilder({ title: "Queue System", description: join_message, color: interaction.guild?.members.me?.roles.highest.color || 0x7289da }),
                            ],
                        components: [
                            new ActionRowBuilder<ButtonBuilder>(
                                {
                                    components:
                                        [
                                            new ButtonBuilder({ customId: "queue_refresh", label: "Refresh", style: ButtonStyle.Primary }),
                                            new ButtonBuilder({ customId: "queue_leave", label: "Leave queue", style: ButtonStyle.Danger }),
                                        ],
                                }),
                        ],
                    });
            } catch (error) {
                console.log(error);
            }
        } else {
            await interaction.update(
                {
                    embeds:
                        [
                            new EmbedBuilder({ title: "Queue System", description: `--${queue.name}--\nPosition:${(queue as QueueDocument).getPosition(entry.discord_id) + 1}/${queue.entries.length}\nTime Spent: ${moment.duration(Date.now() - (+entry.joinedAt)).format("d[d ]h[h ]m[m ]s.S[s]")}`, color: client.guilds.cache.get((g as Guild & { _id: string })._id)?.members.me?.roles.highest.color || 0x7289da }),
                        ],
                    components: [],
                });
        }
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;