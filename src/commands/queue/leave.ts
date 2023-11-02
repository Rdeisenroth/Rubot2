import { Message } from "discord.js";
import { Command } from "../../../typings";
import { GuildModel } from "../../models/guilds";

const command: Command = {
    name: "leave",
    description: "Leave the current Queue",
    aliases: ["broadcast"],
    cooldown: 3000,
    guildOnly: true,
    execute: async (client, interaction, args) => {
        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, "Slash Only Command", "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.");
            return;
        }

        const g = interaction.guild!;
        const guildData = (await GuildModel.findById(g.id));
        if (!guildData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Guild Data Could not be found.", empheral: true });
        }

        const user = client.utils.general.getUser(interaction);
        const queueData = guildData.queues.find(x => x.contains(user.id));
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "You are currently not in a queue.", empheral: true });
        }

        const leave_msg = queueData.getLeaveMessage(user.id);
        await queueData.leave(user.id);


        if (client.queue_stays.get(user.id)?.get(queueData._id!.toHexString()) === client.utils.general.QueueStayOptions.PENDING) {
            client.queue_stays.get(user.id)!.set(queueData._id!.toHexString(), client.utils.general.QueueStayOptions.LEFT);
        }

        try {
            const member = g.members.resolve(user);
            const vcData = await guildData.voice_channels.id(member?.voice.channelId);
            if (vcData?.queue?.equals(queueData._id!)) {
                await member!.voice.disconnect();
            }
            const roles = await g.roles.fetch();
            const waiting_role = roles.find(x => x.name.toLowerCase() === queueData.name.toLowerCase() + "-waiting");

            if (waiting_role && member && member.roles.cache.has(waiting_role.id)) {
                await member.roles.remove(waiting_role);
            }
        } catch (error) {
            console.log(error);
        }
        await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: leave_msg, empheral: true });
        // client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;