import { Message } from "discord.js";
import { Command } from "../../../typings";
import GuildSchema from "../../models/guilds";

const command: Command = {
    name: "info",
    description: "displays Information about the current Queue",
    aliases: ["i", "details", "d"],
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
        const guildData = (await GuildSchema.findById(g.id));
        if (!guildData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Guild Data Could not be found.", empheral: true });
        }

        const user = client.utils.general.getUser(interaction);
        const queueData = guildData.queues.find(x => x.entries.find(y => y.discord_id == user.id));
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Queue Could not be Found.", empheral: true });
        }

        await client.utils.embeds.SimpleEmbed(interaction, {
            title: "Queue Information", text: `
        \\> Name: ${queueData.name}
        \n\\> Description: ${queueData.description}
        \n\\> Active Entries: ${queueData.entries.length}
        `, empheral: true,
        });

        // client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`)
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;