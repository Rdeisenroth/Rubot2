import { ApplicationCommandOptionType, EmbedField, Message } from "discord.js";
import moment from "moment";
import { Command } from "../../../../typings";
import { GuildModel } from "../../../models/guilds";
import { SessionModel } from "../../../models/sessions";

const command: Command = {
    name: "terminate",
    description: "lists all currently active Coaching Sessions",
    aliases: ["t"],
    usage: "[coach]",
    cooldown: 3000,
    category: "Miscellaneous",
    options: [
        {
            name: "coach",
            description: "The Coach linked to the session",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
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
        let member = interaction.options.getUser("coach", true);
        member = await member.fetch();
        // if (!(member instanceof User)) {
        //     return await client.utils.embeds.SimpleEmbed(interaction, { title: "Session System", text: ":X: invalid User", empheral: true });
        // }
        const sessions = await SessionModel.find({ guild: g.id, active: true, user: member.id });
        const sortedSessions = sessions.sort((x, y) => (+x.started_at!) - (+y.started_at!));

        const dmChannel = await member.createDM();

        const fields: EmbedField[] = [];
        for (const e of sortedSessions) {
            // Set inactive
            e.active = false;
            e.ended_at = Date.now().toString();
            e.end_certain = true;
            await e.save();
            // Notify Coach
            try {
                await client.utils.embeds.SimpleEmbed(dmChannel, {
                    title: "Coaching System", text: "Your coaching Session was terminated by an administrator."
                        + `\n\\> Total Time Spent: ${moment.duration((+e.ended_at!) - (+e.started_at!)).format("d[d ]h[h ]m[m ]s.S[s]")}`
                        + `\n\\> Channels visited: ${e.getRoomAmount()}`
                        + `\n\\> Participants: ${(await e.getParticipantAmount())}`,
                });
            } catch (error) {
                return await client.utils.embeds.SimpleEmbed(interaction, { title: "Session System", text: `Error: Could not notify ${member} `, empheral: true });
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