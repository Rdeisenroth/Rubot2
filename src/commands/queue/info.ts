import { Message, EmbedField } from "discord.js";
import { Command } from "../../../typings";
import { GuildModel } from "../../models/guilds";

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
        const guildData = (await GuildModel.findById(g.id));
        if (!guildData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Guild Data Could not be found.", empheral: true });
        }

        const user = client.utils.general.getUser(interaction);
        const queueData = guildData.queues.find(x => x.contains(user.id));
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "You are currently not in a queue.", empheral: true });
        }

        const queuePosition = queueData.getPosition(user.id);
        await client.utils.embeds.SimpleEmbed(interaction, {
            title: "Queue Information",
            fields:
                [
                    { name: "❯ Name", value: `${queueData.name}` },
                    { name: "❯ Description", value: `${queueData.description}` },
                    { name: "❯ Active Entries", value: `${queueData.entries.length}` },
                    { name: "❯ Your Position", value: queuePosition < 0 ? "You are not in the Queue" : `${queuePosition + 1}/${queueData.entries.length}` },
                ] as EmbedField[],
            empheral: true,
        });

        // client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`)
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;