import { ApplicationCommandOptionType, Message } from "discord.js";
import path from "path";
import { Command } from "../../../../typings";

const command: Command = {
    name: "notify_all",
    description: "Broadcasts a Message to all Users in the Current Coaching Session (all Rooms)",
    aliases: ["broadcast"],
    cooldown: 10000,
    guildOnly: true,
    options: [{
        name: "message",
        description: "The Message to brodcast",
        type: ApplicationCommandOptionType.String,
        required: true,
    }],
    execute: async (client, interaction, args) => {
        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, "Slash Only Command", "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.");
            return;
        }

        const g = interaction.guild!;

        client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;