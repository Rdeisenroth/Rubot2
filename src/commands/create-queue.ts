import { Message } from "discord.js";
import { Command } from "../../typings";
import GuildSchema from "../models/guilds";
import { Queue } from "../models/queues";

const command: Command = {
    name: "create-queue",
    description: "creates a queue",
    aliases: ["cq"],
    usage: "[channel resolvable]",
    cooldown: 5,
    category: "Coaching",
    options: [
        {
            name: "name",
            description: "The Queue Name",
            type: "STRING",
            required: true,
        },
        {
            name: "description",
            description: "The Queue Description",
            type: "STRING",
            required: false,
        },
    ],
    guildOnly: true,
    defaultPermission: false,
    execute: async (client, interaction, args) => {
        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, "Slash Only Command", "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.");
            return;
        }
        const owner = client.users.cache.find(m => m.id == client.ownerID);
        const member = client.utils.general.getMember(interaction);
        if (!member || member.id !== client.ownerID as string) {
            await interaction?.reply("You do not have permission to execute this command.");
            return;
        }

        const g = interaction!.guild!;

        const guildData = (await GuildSchema.findById(g.id))!;
        const queue: Queue = {
            name: interaction.options.getString("name", true),
            description: interaction.options.getString("description", true),
            disconnect_timeout: 60000,
            match_timeout: 120000,
            limit: 150,
            join_message: "You joined the ${name} queue.\n\\> Your Position: ${pos}/${total}\n\\> Total Time Spent: ${time_spent}",
            match_found_message: "You have found a Match with ${match}. Please Join ${match_channel} if you are not moved automatically. If you don't join in ${timeout} seconds, your position in the queue is dropped.",
            timeout_message: "Your queue Timed out after ${timeout} seconds.",
            leave_message: "You Left the `${name}` queue.\nTotal Time Spent: ${time_spent}",
            entries: [],
        };
        guildData.queues.push(queue);
        await guildData.save();
        await client.utils.embeds.SimpleEmbed(interaction, "Queue System", `You created the queue ${queue.name}`);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;