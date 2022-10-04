import UserSchema, { User } from "./../models/users";
import { ApplicationCommandOptionType, GuildMember, Interaction, Message } from "discord.js";
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
        type: ApplicationCommandOptionType.String,
        required: true,
    }],
    async execute(client, interaction, args) {

        if (!interaction) {
            return;
        }

        // Check Token
        let token: string;
        if (interaction instanceof Message) {
            token = args[0];
        } else {
            token = interaction.options.getString("token-string", true);
        }
        return await client.utils.general.verifyUser(interaction, token);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;