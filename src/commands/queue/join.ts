import { ApplicationCommandOptionType, Message } from "discord.js";
import { Command } from "../../../typings";
import { GuildModel } from "../../models/guilds";
import { UserModel } from "../../models/users";

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
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "intent",
            description: "The Intent",
            type: ApplicationCommandOptionType.String,
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
        const guildData = (await GuildModel.findById(g.id));
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
        const userData = await UserModel.findById(user.id);
        if (await userData?.hasActiveSessions()) {
            await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "You cannot join a queue with an active coaching session.", empheral: true });
            return;
        }

        // Locked?
        if (queueData.locked) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: `The Queue ${queueData.name} is currently Locked.`, empheral: true });
        }

        // Join Queue
        await queueData.join({
            discord_id: user.id,
            joinedAt: Date.now().toString(),
            importance: 1,
            intent: interaction.options.getString("intent") ?? undefined,
        });


        try {
            const roles = await g.roles.fetch();
            const waiting_role = roles.find(x => x.name.toLowerCase() === queueData.name.toLowerCase() + "-waiting");

            const member = g.members.resolve(user);
            if (waiting_role && member && !member.roles.cache.has(waiting_role.id)) {
                member.roles.add(waiting_role);
            }
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