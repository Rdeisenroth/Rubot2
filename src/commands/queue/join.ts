import { Message } from "discord.js";
import path from "path";
import { Command } from "../../../typings";
import GuildSchema from "../../models/guilds";
import UserSchema from "../../models/users";

const command: Command = {
    name: "join",
    description: "Join a queue",
    aliases: ["broadcast"],
    cooldown: 3000,
    guildOnly: true,
    options: [
        {
            name: "queue",
            description: "The Queue to join",
            type: "STRING",
            required: true,
        },
        {
            name: "intent",
            description: "The Intent",
            type: "STRING",
            required: false,
        },
    ],
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
        const queueName = interaction.options.getString("queue", true);
        const queueData = guildData.queues.find(x => x.name === queueName);
        if (!queueData) {
            await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: `${queueName} could not be Found. Available Queues: ${guildData.queues.map(x => x.name).join(", ")}`, empheral: true });
            return;
        }

        // Check if member already is in Queue
        const otherQueue = guildData.queues.find(x => x.contains(user.id));
        if (otherQueue) {
            await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: `You are already in the ${otherQueue.name} Queue.\nAvailable Queues: ${guildData.queues.map(x => x.name).join(", ")}`, empheral: true });
            return;
        }

        // Check if Tutor Session active
        const userData = await UserSchema.findById(user.id);
        if (userData?.hasActiveSessions()) {
            await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "You cannot join a queue with an active coaching session.", empheral: true });
            return;
        }

        // Join Queue
        await queueData.join({
            discord_id: user.id,
            joinedAt: Date.now().toString(),
            importance: 1,
            intent: interaction.options.getString("intent") ?? undefined,
        });

        try {
            // const member = g.members.resolve(user);
            // await member?.voice.disconnect();
        } catch (error) {
            console.log(error);
        }
        await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: queueData.getJoinMessage(user.id), empheral: true });

        // await client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;