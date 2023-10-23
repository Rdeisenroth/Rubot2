import { ApplicationCommandOptionType, Message, Role } from "discord.js";
import { Command } from "../../../typings";
import "moment-duration-format";
import {UserModel, User } from "../../models/users";
import {GuildModel} from "../../models/guilds";
import { DBRole, InternalRoles, RoleScopes } from "../../models/bot_roles";
import { Types } from "mongoose";



/**
 * The Command Definition
 */
const command: Command = {
    name: "decrypttoken",
    guildOnly: false,
    options: [
        {
            name: "token",
            description: "The String to decrypt",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    description: "Temp Command that decrypts a given String.",
    async execute(client, interaction, args) {
        if (!interaction || !interaction.guild) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, "Slash Only Command", "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.");
            return;
        }
        let decrypted: string;
        try {
            decrypted = client.utils.general.decryptText(interaction.options.getString("token", true));
        } catch (error) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Verification System Error", text: "Token is not valid.", empheral: true });
        }
        return client.utils.embeds.SimpleEmbed(interaction, { title: "Decrypted Text", text: `decrypted: ${decrypted}`, empheral:true});
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;