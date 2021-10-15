import UserSchema, { User } from "./../models/users";
import { GuildMember, Interaction, Message, MessageEmbed } from "discord.js";
import { Command, RunCommand } from "../../typings";
import { verify_secret } from "../../config.json";
import * as crypto from "crypto";

/**
 * The Command Definition
 */
const command: Command = {
    name: "verify",
    aliases: ["v"],
    invisible: false,
    guildOnly: true,
    description: "Verifies the User with a given Token String",
    category: "Moderation",
    options: [{
        name: "token-string",
        description: "The Token String",
        type: "STRING",
        required: true,
    }],
    async execute(client, interaction, args) {

        if (!interaction) {
            return;
        }
        let token: string;
        if (interaction instanceof Message) {
            token = args[0];
        } else {
            token = interaction.options.getString("token-string", true);
        }
        const rauteSplit = token.split("#");
        if (rauteSplit.length != 2) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Verification System Error", text: "Invalid Token String.", empheral: true });

        }
        const [other_infos, hmac] = rauteSplit;

        // HMAC bilden
        const expected_hmac = crypto.createHmac("sha256", verify_secret)
            .update(other_infos)
            .digest("hex");

        if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected_hmac))) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Verification System Error", text: "Invalid Token String.", empheral: true });
        }

        const member = interaction.member;
        if (!(member instanceof GuildMember)) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Verification System Error", text: "User Not Found.", empheral: true });
        }

        const verifiedRole = member.guild.roles.cache.find(x => x.name.toLowerCase() === "verified");
        if (!verifiedRole) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Verification System Error", text: "Verified-Role Could not be found.", empheral: true });
        }

        if (member.roles.cache.has(verifiedRole.id)) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Verification System Error", text: "Your account has already been verified.", empheral: true });
        }
        await member.roles.add(verifiedRole);

        // Token-Format: "FOP-DiscordV1|tu-id|moodle-id#hmac"
        const [version_string, tu_id, moodle_id] = other_infos.split("|");

        if (version_string === "FOP-DiscordV1-Tutor") {
            const coachRole = member.guild.roles.cache.find(x => x.name.toLowerCase() === "verified");
            if (!coachRole) {
                return await client.utils.embeds.SimpleEmbed(interaction, { title: "Verification System Error", text: "Coach-Role Could not be found.", empheral: true });
            }
            if (member.roles.cache.has(coachRole.id)) {
                return await client.utils.embeds.SimpleEmbed(interaction, { title: "Verification System Error", text: "Your account has already been verified.", empheral: true });
            }
            await member.roles.add(coachRole);
        }

        let databaseUser = await UserSchema.findById(member.id);
        if (!databaseUser) {
            databaseUser = new UserSchema({ _id: member.id });
            await databaseUser.save();
        }
        databaseUser.tu_id = tu_id;
        databaseUser.moodle_id = moodle_id;

        console.log(`Linked ${member.displayName} to TU-ID: "${tu_id}", Moodle-ID: "${moodle_id}"`);

        try {
            await databaseUser.save();
        } catch (error) {
            console.log(error);
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Verification System Error", text: "You can only Link one Discord Account.", empheral: true });
        }

        return await client.utils.embeds.SimpleEmbed(interaction, { title: "Verification System", text: "Your Discord-Account has been verified.", empheral: true });

    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;