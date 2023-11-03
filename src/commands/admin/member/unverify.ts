import { ApplicationCommandOptionType, EmbedField, Message } from "discord.js";
import { Command } from "../../../../typings";
import { UserModel } from "../../../models/users";

const command: Command = {
    name: "unverify",
    description: "Drops verification for user",
    aliases: ["uv"],
    usage: "[channel resolvable]",
    cooldown: 3000,
    category: "Miscellaneous",
    options: [
        {
            name: "user",
            description: "The User to unverify",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
        {
            name: "reason",
            description: "a reason",
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
        let user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason");
        user = await user.fetch();
        const userData = await UserModel.findById(user.id);

        if (!userData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Verification System", text: `User ${user} not found in database.`, empheral: true });
        }

        const member = await interaction.guild?.members.fetch(user);
        if (!member) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Verification System", text: "User is not a member of the guild.", empheral: true });
        }

        const verifiedRole = interaction.guild!.roles.cache.find(x => x.name.toLowerCase() === "verified");
        if (!verifiedRole) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Verification System", text: "Verification Role not found.", empheral: true });
        }
        if (!member.roles.cache.has(verifiedRole.id)) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Verification System", text: "User doesn't have verified role", empheral: true });
        }
        const old_tu_id = userData.tu_id;
        const old_moodle_id = userData.moodle_id;
        try {
            member.roles.remove(verifiedRole, "Removed by admin");
            userData.tu_id = undefined;
            userData.moodle_id = undefined;
            await userData.save();
            const dm = await member.createDM();
            await client.utils.embeds.SimpleEmbed(dm, { title: "Verification System", text: ("Your Verification has been undone by an admin. The Token can now be used on a different account." + (reason ? `\nreason: ${reason}` : "")) });
        } catch (error) {
            console.log(error);
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Verification System", text: "Cannot DM User", empheral: true });
        }

        const fields: EmbedField[] = [
            // { name: "Verified", value: `${userData.tu_id != ""}` },
        ];
        if (userData.tu_id) {
            fields.push(
                { name: ">Previous TU-ID", value: `${old_tu_id}`, inline: false },
                { name: ">Previous Moodle-ID", value: `${old_moodle_id}`, inline: false },
            );
        }

        // 

        await client.utils.embeds.SimpleEmbed(interaction, {
            title: "Verification System",
            text: `Sucessfully unverified ${user}.`,
            empheral: true,
            fields,
        });
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;