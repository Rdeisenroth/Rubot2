import ChannelType, { EmojiIdentifierResolvable, GuildMember, Message, MessageEmbed, StageChannel } from "discord.js";
import { OverwriteData } from "discord.js";
import moment from "moment";
import { ButtonInteraction, Command, ComponentInteraction, RunCommand } from "../../../../typings";
import GuildSchema, { Guild, GuildDocument } from "../../../models/guilds";
import { Queue, QueueDocument } from "../../../models/queues";
import { VoiceChannel, VoiceChannelDocument } from "../../../models/voice_channels";
import { VoiceChannelSpawner } from "../../../models/voice_channel_spawner";

const command: ButtonInteraction = {
    customID: 'queue_refresh',
    description: 'refresh the current queue info',
    // cooldown: 30000,
    execute: async (client, interaction) => {
        let guilds = await GuildSchema.find()
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
            await interaction.update({ components: [] })
            return;
        }

        let entry = queue.entries.find(x => x.discord_id === interaction.user.id)!;
        if (queue.join_message) {
            try {
                let replacements = {
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
                }
                // Interpolate String
                let join_message = client.utils.general.interpolateString(queue.join_message, replacements);
                await interaction.update({ embeds: [new MessageEmbed({ title: `Queue System`, description: join_message, color: interaction.guild?.me?.roles.highest.color || 0x7289da })] });
            } catch (error) {
                console.log(error);
            }
        } else {
            await interaction.update({ embeds: [new MessageEmbed({ title: `Queue System`, description: `--${queue.name}--\nPosition:${(queue as QueueDocument).getPosition(entry.discord_id) + 1}/${queue.entries.length}\nTime Spent: ${moment.duration(Date.now() - (+entry.joinedAt)).format("d[d ]h[h ]m[m ]s.S[s]")}`, color: client.guilds.cache.get((g as Guild & { _id: string })._id)?.me?.roles.highest.color || 0x7289da })], components: [] })
        }
    }
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;