import { Message } from "discord.js";
import { Command } from "../../../../typings";
import GuildSchema from "../../../models/guilds";
import UserSchema from "../../../models/users";

const command: Command = {
    name: "unsubscribe",
    description: "Stop receiving notifications if a user joins the previously empty queue.",
    aliases: ["unsub"],
    guildOnly: true,
    execute: async (client, interaction, args) => {
        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, "Slash Only Command", "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.");
            return;
        }
        try {
            await interaction.deferReply({ ephemeral: true });
        } catch (error) {
            return console.log(error);
        }

        const g = interaction.guild!;
        const guildData = (await GuildSchema.findById(g.id));
        if (!guildData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Guild Data Could not be found.", empheral: true });
        }

        const user = client.utils.general.getUser(interaction);
        const userEntry = await UserSchema.findOneAndUpdate({ _id: user.id }, { _id: user.id }, { new: true, upsert: true, setDefaultsOnInsert: true });
        // Check if User has Active Sessions
        const activeSessions = await userEntry.getActiveSessions();
        // We expect at most 1 active session per guild
        const coachingSession = activeSessions.find(x => x.guild && x.guild === g.id);
        if (!coachingSession) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "You Have no Active Coaching Session.", empheral: true });
        }
        if (!coachingSession.queue) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "There is no Queue Linked to your Session.", empheral: true });
        }

        const queue = coachingSession.queue;
        const queueData = guildData.queues.id(queue);
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Queue Could not be Found.", empheral: true });
        }

        // nofity coach when a new user joins the empty queue
        if (queueData.unsubscribeOnJoinWhenEmpty(user.id))
        {
            // Inform user about the success
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Success: You will now no longer receive notifications if a user joins the previously empty queue.", empheral: true });
        }
        else {
            // Inform user about the failure
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Failure: You should have already received no notifications when a user joined the previously empty queue.", empheral: true });         
        }
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;