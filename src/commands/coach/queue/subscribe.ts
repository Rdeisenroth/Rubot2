import EventSchema, { Event as EVT, eventType } from "../../../models/events";
import { PermissionOverwriteData } from "../../../models/permission_overwrite_data";
import ChannelType, { ApplicationCommandOptionType, Message } from "discord.js";
import { Command } from "../../../../typings";
import GuildSchema from "../../../models/guilds";
import UserSchema from "../../../models/users";
import RoomSchema from "../../../models/rooms";
import { VoiceChannelSpawner } from "../../../models/voice_channel_spawner";

const command: Command = {
    name: "subscribe",
    description: "Get a notification if a user joins the previously empty queue.",
    aliases: ["sub"],
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
        queueData.notifyOnJoinWhenEmpty(async () => await client.utils.embeds.SimpleEmbed((await user.createDM()), "Coaching system", "A user joined the queue."));
        
        // Inform user about the success
        return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "You will now get a notification if a user joins the previously empty queue.", empheral: true });
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;