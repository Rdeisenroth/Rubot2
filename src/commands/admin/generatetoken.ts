import { ApplicationCommandOptionType, Message } from "discord.js";
import { Command } from "../../../typings";
import "moment-duration-format";


/**
 * The Command Definition
 */
const command: Command = {
    name: "generatetoken",
    guildOnly: false,
    options: [
        {
            name: "encryptionstring",
            description: "The String to encrypt",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    description: "Temp Command that encrypts a given String.",
    async execute(client, interaction, args) {
        if (!interaction || !interaction.guild) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, "Slash Only Command", "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.");
            return;
        }
        const encrypted = client.utils.general.encryptText(interaction.options.getString("encryptionstring", true));
        const decrypted = client.utils.general.decryptText(encrypted);
        return client.utils.embeds.SimpleEmbed(interaction, { title: "Encrypted+Decrypted Text", text: `encrypted: ${encrypted}\ndecrypted: ${decrypted}`, empheral:true });
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;