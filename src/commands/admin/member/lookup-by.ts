import { ApplicationCommandOptionType, EmbedField, Message } from "discord.js";
import { Command } from "../../../../typings";
import { UserModel, User } from "../../../models/users";
import { FilterQuery } from "mongoose";
import { DocumentType, mongoose } from "@typegoose/typegoose";
import { FilterOutFunctionKeys } from "@typegoose/typegoose/lib/types";

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
            type: ApplicationCommandOptionType.String,
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
            type: ApplicationCommandOptionType.String,
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
        let userQuery: FilterQuery<DocumentType<User>> = {};
        let userData: DocumentType<User> | null | undefined;
        if (type === "discord-tag") {
            const members = await interaction.guild?.members.fetch();
            const member = members?.find(x => x.user.tag === query);
            userData = new UserModel({
                _id: member?.id ?? "",
                server_roles: new mongoose.Types.Array(),
                sessions: new mongoose.Types.DocumentArray([]),
                token_roles: new mongoose.Types.DocumentArray([]),
            } as FilterOutFunctionKeys<User>);
        } else {
            if (type === "tu-id") {
                userQuery = { tu_id: query };
            } else if (type === "moodle-id") {
                userQuery = { moodle_id: query };
            } else {
                userQuery = { _id: query };
            }
            userData = await UserModel.findOne(userQuery);
        }
        // user = await user.fetch();

        if (!userData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Verification System", text: `User ${query} not found in database.`, empheral: true });
        }

        const user = await client.users.fetch(userData._id);

        const fields: EmbedField[] = [
            { name: "Verified", value: `${(userData.tu_id && typeof userData.tu_id === "string" && userData.tu_id.length > 0) ? true : false}`, inline: false },
        ];
        if (userData.tu_id) {
            fields.push(
                { name: "❯ TU-ID", value: `${userData.tu_id}`, inline:false },
                { name: "❯ Moodle-ID", value: `${userData.moodle_id}`, inline:false },
                { name: "❯ Link", value: `https://moodle.informatik.tu-darmstadt.de/user/view.php?id=${userData.moodle_id}&course=1088`, inline:false },
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