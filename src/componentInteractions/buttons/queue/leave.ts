import { Collection, MessageEmbed } from "discord.js";
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
            queue = g.queues.find(x => x.contains(interaction.user.id));
            if (!queue) {
                continue;
            }
            break;
        }
        if (!g || !queue) {
            await interaction.update({ components: [] });
            return;
        }

        const member_id = interaction.user.id;

        if (client.queue_stays.get(member_id)?.get(queue._id!.toHexString()) === client.utils.general.QueueStayOptions.PENDING) {
            client.queue_stays.get(member_id)!.set(queue._id!.toHexString(), client.utils.general.QueueStayOptions.LEFT);
        }


        // Leave the Queue
        const leave_msg = queue.getLeaveMessage(interaction.user.id);
        await queue.leave(interaction.user.id);
        let color = 0x7289da;
        try {
            const guild = client.guilds.cache.get(g._id);
            color = guild?.me?.roles.highest.color ?? 0x7289da;
            const member = guild?.members.cache.get(interaction.user.id);
            const vcData = await g.voice_channels.id(member?.voice.channelId);
            if (vcData?.queue?.equals(queue._id!)) {
                await member!.voice.disconnect();
            }
            const roles = await guild?.roles.fetch();
            const waiting_role = roles?.find(x => x.name.toLowerCase() === queue!.name.toLowerCase() + "-waiting");

            if (waiting_role && member && member.roles.cache.has(waiting_role.id)) {
                await member.roles.remove(waiting_role);
            }
            await member?.voice.disconnect();
        } catch (error) {
            console.log(error);
        }
        await interaction.update({ embeds: [new MessageEmbed({ title: "Queue System", description: leave_msg, color: color })], components: [] });
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;