import { EmbedFieldData, Message } from "discord.js";
import path from "path";
import { Command } from "../../../../typings";
import GuildSchema from "../../../models/guilds";
import UserSchema from "../../../models/users";

const command: Command = {
    name: "lock",
    description: "Locks the Queue and disables the /queue join command",
    aliases: ["s", "begin", "b"],
    options: [
        {
            name: "queue",
            description: "The Queue",
            type: "STRING",
            required: true,
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

        await interaction.deferReply();

        const g = interaction.guild!;
        const guildData = (await GuildSchema.findById(g.id));
        if (!guildData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Guild Data Could not be found.", empheral: true });
        }

        const queueName = interaction.options.getString("queue", true);
        const queueData = guildData.queues.find(x => x.name.toLowerCase() === queueName.toLowerCase());
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: `Queue ${queueName} could not be fould.`, empheral: true });
        }

        // Lock
        queueData.lock();

        await client.utils.embeds.SimpleEmbed(interaction, {
            title: "Coaching System",
            text: `Queue ${queueData.name}-was locked.`,
            empheral: true,
        });
        // client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;