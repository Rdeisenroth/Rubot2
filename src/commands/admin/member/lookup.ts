import { ApplicationCommandOptionType, EmbedField, Message } from "discord.js";
import { Command } from "../../../../typings";
import { UserModel } from "../../../models/users";

const command: Command = {
    name: "lookup",
    description: "gets user infos",
    aliases: ["l"],
    usage: "[channel resolvable]",
    cooldown: 3000,
    category: "Miscellaneous",
    options: [
        {
            name: "user",
            description: "The User to check",
            type: ApplicationCommandOptionType.User,
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
        let user = interaction.options.getUser("user", true);
        user = await user.fetch();
        const userData = await UserModel.findById(user.id);

        if (!userData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Verification System", text: `User ${user} not found in database.`, empheral: true });
        }

        const fields: EmbedField[] = [
            { name: "Verified", value: `${(userData.tu_id && typeof userData.tu_id === "string" && userData.tu_id.length > 0) ? true : false}`, inline: false },
        ];
        if (userData.tu_id) {
            fields.push(
                { name: "❯ TU-ID", value: `${userData.tu_id}`, inline: false },
                { name: "❯ Moodle-ID", value: `${userData.moodle_id}`, inline: false },
                { name: "❯ Link", value: `https://moodle.informatik.tu-darmstadt.de/user/view.php?id=${userData.moodle_id}&course=1088`, inline: false },
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