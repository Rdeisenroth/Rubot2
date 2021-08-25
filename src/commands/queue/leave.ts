import { Message } from "discord.js";
import moment from "moment";
import path from "path";
import { Command } from "../../../typings";
import GuildSchema from "../../models/guilds";

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
        const guildData = (await GuildSchema.findById(g.id));
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

        try {
            const member = g.members.resolve(user);
            await member?.voice.disconnect();
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