import { EmbedField, Message } from "discord.js";
import moment from "moment";
import { Command } from "../../../../typings";
import { GuildModel } from "../../../models/guilds";
import { SessionModel } from "../../../models/sessions";

const command: Command = {
    name: "terminateall",
    description: "Terminates all active Coaching Sessions on the Server",
    aliases: ["t"],
    usage: "[coach]",
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
        const guildData = (await GuildModel.findById(g.id))!;
        // if (!(member instanceof User)) {
        //     return await client.utils.embeds.SimpleEmbed(interaction, { title: "Session System", text: ":X: invalid User", empheral: true });
        // }
        const sessions = await SessionModel.find({ guild: g.id, active: true });
        const sortedSessions = sessions.sort((x, y) => (+x.started_at!) - (+y.started_at!));

        

        const fields: EmbedField[] = [];
        for (const e of sortedSessions) {
            // Set inactive
            e.active = false;
            e.ended_at = Date.now().toString();
            e.end_certain = true;
            await e.save();
            // Notify Coach
            try {
                const member = await g.members.fetch(e.user);
                const dmChannel = await member.createDM();
                await client.utils.embeds.SimpleEmbed(dmChannel, {
                    title: "Coaching System", text: "Your coaching Session was terminated by an administrator."
                        + `\n\\> Total Time Spent: ${moment.duration((+e.ended_at!) - (+e.started_at!)).format("d[d ]h[h ]m[m ]s.S[s]")}`
                        + `\n\\> Channels visited: ${e.getRoomAmount()}`
                        + `\n\\> Participants: ${(await e.getParticipantAmount())}`,
                });
            } catch (error) {
                return await client.utils.embeds.SimpleEmbed(interaction, { title: "Session System", text: `Error: Could not notify <@${e.user}> `, empheral: true });
            }
        }

        await client.utils.embeds.SimpleEmbed(interaction, {
            title: "Session System",
            // text: "test",
            text: `Terminated ${sortedSessions.length} Active Coaching Sessions`,
            empheral: true,
            fields,
        });
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;