import { Message } from "discord.js";
import { Command } from "../../../../typings";
import { GuildModel } from "../../../models/guilds";
import { UserModel } from "../../../models/users";
import moment from "moment";
import { removeRoleFromUser } from "../../../utils/general";

const command: Command = {
    name: "quit",
    description: "closes the Coaching Session",
    aliases: ["q", "exit", "e", "terminate"],
    usage: "[channel resolvable]",
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
        // Check if User has Active Sessions
        const activeSessions = await userEntry.getActiveSessions();
        // We expect at most 1 active session per guild
        const coachingSession = activeSessions.find(x => x.guild && x.guild === g.id);
        if (!coachingSession) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "You Have no Active Coaching Session.", empheral: true });
        }

        await removeRoleFromUser(g, user, "active_session");

        //TODO: Terminate Rooms

        // Set inactive
        coachingSession.active = false;
        coachingSession.ended_at = Date.now().toString();
        coachingSession.end_certain = true;
        await coachingSession.save();

        // Compute some Session Data

        client.utils.embeds.SimpleEmbed(interaction, {
            title: "Coaching System", text: `Your Session ended.
        \n\\> Total Time Spent: ${moment.duration((+coachingSession.ended_at!) - (+coachingSession.started_at!)).format("d[d ]h[h ]m[m ]s.S[s]")}
        \n\\> Channels visited: ${coachingSession.getRoomAmount()}
        \n\\> Participants: ${(await coachingSession.getParticipantAmount())}
        `, empheral: true,
        });
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;