import { EmbedFieldData, Message } from "discord.js";
import moment from "moment";
import { Command } from "../../../../typings";
import GuildSchema from "../../../models/guilds";
import UserSchema, { User, UserDocument } from "../../../models/users";
import SessionSchema from "../../../models/sessions";
import QueueSchema from "../../../models/queues";
import { FilterQuery } from "mongoose";

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
                {
                    name: "discord-id",
                    value: "discord-id",
                },
                {
                    name: "discord-tag",
                    value: "discord-tag",
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
        const type = interaction.options.getString("type", true);
        const query = interaction.options.getString("query", true);
        let userQuery: FilterQuery<UserDocument> = {};
        let userData: (User & { _id: string; }) | undefined;
        if (type === "discord-tag") {
            const members = await interaction.guild?.members.fetch();
            const member = members?.find(x => x.user.tag === query);
            userData = {
                _id: member?.id ?? "",
                server_roles: [],
                sessions: [],
                token_roles: [],
            };
        } else {
            if (type === "tu-id") {
                userQuery = { tu_id: query };
            } else if (type === "moodle-id") {
                userQuery = { moodle_id: query };
            } else {
                userQuery = { _id: query };
            }
            userData = (await UserSchema.findOne(userQuery))?.toObject<User & { _id: string }>();
        }
        // user = await user.fetch();

        if (!userData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Verification System", text: `User ${query} not found in database.`, empheral: true });
        }

        const user = await client.users.fetch(userData._id);

        const fields: EmbedFieldData[] = [
            { name: "Verified", value: `${(userData.tu_id && typeof userData.tu_id === "string" && userData.tu_id.length > 0) ? true : false}` },
        ];
        if (userData.tu_id) {
            fields.push(
                { name: "❯ TU-ID", value: `${userData.tu_id}` },
                { name: "❯ Moodle-ID", value: `${userData.moodle_id}` },
                { name: "❯ Link", value: `https://moodle.informatik.tu-darmstadt.de/user/view.php?id=${userData.moodle_id}&course=1088` },
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