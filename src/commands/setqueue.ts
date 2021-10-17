import { GuildChannel, Message } from "discord.js";
import { Command } from "../../typings";
import GuildSchema from "../models/guilds";
import { VoiceChannel } from "../models/voice_channels";

const command: Command = {
    name: "setqueue",
    description: "sets the given channel as join to create",
    aliases: ["setwaitingroom", "swr", "setwr", "setqueue", "sq"],
    usage: "[channel resolvable]",
    cooldown: 5,
    category: "Miscellaneous",
    options: [
        {
            name: "channel",
            description: "The Channel to be the Waiting Room",
            type: "CHANNEL",
            required: true,
        },
        {
            name: "queue",
            description: "A valid queue",
            type: "STRING",
            required: true,
        },
        {
            name: "supervisor",
            description: "A Supervisor Role",
            type: "ROLE",
            required: true,
        },
    ],
    guildOnly: true,
    defaultPermission: false,
    execute: async (client, interaction, args) => {
        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            return await client.utils.embeds.SimpleEmbed(interaction, "Slash Only Command", "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.");
        }
        await interaction.deferReply();
        const g = interaction.guild!;

        // Find channel
        // const channel = g!.channels.cache.find(x => x.id == args[0]);
        const channel = interaction.options.getChannel("channel", true);
        if (!channel) {
            return await client.utils.embeds.SimpleEmbed(interaction, "Voice Channel System", ":x: Channel could not be found.");
        }
        if (!(channel instanceof GuildChannel)) {
            return await client.utils.embeds.SimpleEmbed(interaction, "Voice Channel System", ":x: Channel is invalid.");
        }
        const guildData = (await GuildSchema.findById(g.id))!;
        const queueName = interaction.options.getString("queue", true);
        const queueData = guildData.queues.find(x => x.name.toLowerCase() === queueName.toLowerCase());
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, "Voice Channel System", ":x: Queue could not be found.");
        }
        if (guildData.voice_channels.some(x => x.queue === queueData._id)) {
            return await client.utils.embeds.SimpleEmbed(interaction, "Voice Channel System", ":x: Queue already linked to another Channel.");
        }

        const supervisor_role = interaction.options.getRole("supervisor", true);
        const waitingroom_channel: VoiceChannel & { _id: string } = {
            _id: channel.id,
            channel_type: 2,
            locked: false,
            managed: true,
            permitted: [],
            queue: queueData._id,
            supervisors: [supervisor_role.id],
        };
        guildData.voice_channels.push(waitingroom_channel);
        await guildData.save();
        await client.utils.embeds.SimpleEmbed(interaction, "Queue System", `:white_check_mark: The Queue was Linked to the Channel ${channel}.`);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;