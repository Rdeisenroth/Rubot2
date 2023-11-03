import { Message } from "discord.js";
import moment from "moment";
import { Command } from "../../../typings";
import { GuildModel } from "../../models/guilds";
import { UserModel } from "../../models/users";

const command: Command = {
    name: "info",
    description: "displays Information about your Coaching Status (total Sessions,...)",
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

        const g = interaction.guild!;
        const guildData = (await GuildModel.findById(g.id))!;

        const user = client.utils.general.getUser(interaction);
        const userEntry = await UserModel.findOneAndUpdate({ _id: user.id }, { _id: user.id }, { new: true, upsert: true, setDefaultsOnInsert: true });
        // Check if User has any Sessions
        const sessions = await (await userEntry.getSessions()).filter(x => x.guild && x.guild == g.id);
        if (!sessions.length) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "You Have no Past or active Coaching Sessions.", empheral: true });
        }

        let total_time_spent = 0;
        let channel_count = 0;
        let participants = 0;

        for (const session of sessions) {
            if (session.active || session.end_certain) {
                total_time_spent += (session.active ? Date.now() : (+session.ended_at!)) - (+session.started_at!);
            }
            channel_count += session.getRoomAmount();
            participants += await session.getParticipantAmount();
        }

        await client.utils.embeds.SimpleEmbed(interaction, {
            title: "Coaching System", text: `
        \\> Sessions: ${sessions.length}
        \n\\> Total Time Spent: ${moment.duration(total_time_spent).format("d[d ]h[h ]m[m ]s.S[s]")}
        \n\\> Channels visited: ${channel_count}
        \n\\> Participants: ${participants}
        `, empheral: true,
        });

        // client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`)
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;