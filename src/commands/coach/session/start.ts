import { ApplicationCommandOptionType, Message } from "discord.js";
import { Command } from "../../../../typings";
import GuildSchema from "../../../models/guilds";
import UserSchema from "../../../models/users";
import SessionSchema, { sessionRole } from "../../../models/sessions";
import { QueueDocument } from "../../../models/queues";

const command: Command = {
    name: "start",
    description: "starts the Coaching Session",
    aliases: ["s", "begin", "b"],
    usage: "[channel resolvable]",
    category: "Miscellaneous",
    options: [
        {
            name: "queue",
            description: "The Queue linked to the session",
            type: ApplicationCommandOptionType.String,
            required: false,
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

        const g = interaction.guild!;
        const guildData = (await GuildSchema.findById(g.id))!;

        const user = client.utils.general.getUser(interaction);
        const userEntry = await UserSchema.findOneAndUpdate({ _id: user.id }, { _id: user.id }, { new: true, upsert: true, setDefaultsOnInsert: true });
        // Check if User has Active Sessions
        if (await userEntry.hasActiveSessions()) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "You already Have an active Session.", empheral: true });
        }

        // for now we take the first queue
        // TODO: Queue Selector with Select Menu
        if (!guildData.queues || !guildData.queues.length) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Current Guild has no Coaching Support.", empheral: true });
        }

        const queueName = interaction.options.getString("queue");
        let queueData: QueueDocument | undefined = guildData.queues.find(x => x.name === queueName);
        if (!queueData) {
            // await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: `${queueName} could not be Found. Available Queues: ${guildData.queues.map(x => x.name).join(", ")}`, empheral: true });
            // return;
            queueData = (guildData.queues[0] as QueueDocument);
        }
        // const queue = (guildData.queues[0] as QueueDocument);
        // Create New Session
        const session = await SessionSchema.create({ active: true, user: user.id, guild: g.id, queue: queueData._id, role: sessionRole.coach, started_at: Date.now(), end_certain: false, rooms: [] });
        userEntry.sessions.push(session._id);
        await userEntry.save();
        client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "The Session was started.", empheral: true });
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;