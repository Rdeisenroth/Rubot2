import { EmbedFieldData, Message } from "discord.js";
import path from "path";
import { Command } from "../../../../typings";
import GuildSchema from "../../../models/guilds";
import UserSchema from "../../../models/users";

const command: Command = {
    name: "fixup",
    description: "Fixes Leftover roles and Channels when the bot was offline.",
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

        const g = interaction.guild!;
        const guildData = (await GuildSchema.findById(g.id));
        if (!guildData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Guild Data Could not be found.", empheral: true });
        }

        const queue = interaction.options.getString("queue", true);
        const queueData = guildData.queues.find(x => x.name.toLowerCase() === queue.toLowerCase());
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Queue Could not be Found.", empheral: true });
        }

        // await g.members.fetch();

        const fields: EmbedFieldData[] = [];
        for (const e of queueData.getSortedEntries()) {
            const position = queueData.getPosition(e.discord_id) + 1;
            const joined_at = `<t:${Math.round((+e.joinedAt) / 1000)}:f>`;
            const intent = e.intent;
            const member = await g.members.fetch(e.discord_id);
            fields.push({
                name: member.displayName, value:
                    `-Position: ${position}`
                    + `\n-joined at: ${joined_at}`
                    + (intent ? `\n-intent: ${intent}` : ""),
            });
        }

        const roles = await g.roles.fetch();
        const waiting_role = roles.find(x => x.name.toLowerCase() === queueData.name.toLowerCase() + "-waiting");
        if (waiting_role) {
            waiting_role.members.forEach(async m => {
                if (!queueData.contains(m.id)) {
                    await m.roles.remove(waiting_role);
                }
            });
        }

        await client.utils.embeds.SimpleEmbed(interaction, {
            title: "Queue Information",
            text: fields && fields.length ? `Queue Entries of ${queueData.name}` : `Queue ${queueData.name} is empty`,
            empheral: true,
            fields,
        });
        // client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;