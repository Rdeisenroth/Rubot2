import { Message } from "discord.js";
import { Command } from "../../../typings";
import { GuildModel } from "../../models/guilds";

const command: Command = {
    name: "list",
    description: "lists all available queues",
    aliases: ["l"],
    cooldown: 3000,
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
        const guildData = (await GuildModel.findById(g.id));
        if (!guildData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Guild Data Could not be found.", empheral: true });
        }

        return await client.utils.embeds.SimpleEmbed(interaction, { title: "Queue List", fields: guildData.queues.map(x => { return { name: x.name + (x.locked ? " (locked)" : ""), value: x.description ?? "", inline: false }; }) });

        // client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`)
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;