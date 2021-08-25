import { MessageEmbed } from "discord.js";
import { ButtonInteraction } from "../../../../typings";
import GuildSchema, { GuildDocument } from "../../../models/guilds";
import { QueueDocument } from "../../../models/queues";

const command: ButtonInteraction = {
    customID: "queue_leave",
    description: "leave the current queue",
    cooldown: 2000,
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
        // Leave the Queue
        const entry = queue.entries.splice(queue.entries.findIndex(x => x.discord_id === interaction.user.id), 1)[0];
        await g.save();
        try {
            const member = client.guilds.cache.get(g._id)?.members.cache.get(interaction.user.id);
            await member?.voice.disconnect();
        } catch (error) {
            console.log(error);
        }
        await interaction.update({ embeds: [new MessageEmbed({ title: "Queue System", description: queue.getLeaveMessage(entry), color: interaction.guild?.me?.roles.highest.color || 0x7289da })], components: [] });
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;