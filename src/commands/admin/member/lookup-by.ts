import { EmbedFieldData, Message } from "discord.js";
import moment from "moment";
import { Command } from "../../../../typings";
import GuildSchema from "../../../models/guilds";
import UserSchema from "../../../models/users";
import SessionSchema from "../../../models/sessions";
import QueueSchema from "../../../models/queues";

const command: Command = {
    name: "lookup-by",
    description: "gets user infos",
    aliases: ["lb"],
    usage: "[channel resolvable]",
    cooldown: 3000,
    category: "Miscellaneous",
    options: [
        {
            name: "type",
            description: "The query type",
            type: "STRING",
            required: true,
            choices: [
                {
                    name: "tu-id",
                    value: "tu-id",
                },
                {
                    name: "moodle-id",
                    value: "moodle-id",
                },
            ],
        },
        {
            name: "query",
            description: "The User to check",
            type: "STRING",
            required: true,
        },
    ],
    guildOnly: true,
    execute: async (client, interaction, args) => {
        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, "Slash Only Command", "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.");
            return;
        }
        await interaction.deferReply({ ephemeral: true });
        let type = interaction.options.getString("type", true);
        let query = interaction.options.getString("query", true);
        let userData = await UserSchema.findOne(type === "tu-id" ? { tu_id: query } : { moodle_id: query });
        // user = await user.fetch();

        if (!userData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Verification System", text: `User ${query} not found in database.`, empheral: true });
        }

        let user = await client.users.fetch(userData._id);

        const fields: EmbedFieldData[] = [
            { name: "Verified", value: `${(userData.tu_id && typeof userData.tu_id === "string" && userData.tu_id.length > 0) ? true : false}` },
        ];
        if (userData.tu_id) {
            fields.push(
                { name: "> TU-ID", value: `${userData.tu_id}` },
                { name: "> Moodle-ID", value: `${userData.moodle_id}` },
            );
        }

        // 

        await client.utils.embeds.SimpleEmbed(interaction, {
            title: "Verification System",
            text: `Information about User ${user} `,
            empheral: true,
            fields,
        });
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;