import { Message, ApplicationCommandOptionType } from "discord.js";
import { Command } from "../../../typings";
import "moment-duration-format";
import {UserError} from "../../service/error/UserError";
import {QueueService} from "../../service/queue/QueueService";



/**
 * The Command Definition
 */
const command: Command = {
    name: "setleavemessage",
    guildOnly: false,
    description: "Sets the leave message for a specific queue",
    options: [
        {
            name: "message",
            description: "new leave message",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "queue",
            description: "name of the queue",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    async execute(client, interaction, args) {
        if (!interaction || !interaction.guild) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, "Slash Only Command", "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.");
            return;
        }

        const g = interaction!.guild!;
        const queue = interaction.options.getString("queue", true);
        const leaveMessage = interaction.options.getString("message", true)

        try {
            await QueueService.setLeaveMessage(g, queue, leaveMessage)
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Success", text: `new leave message set for queue: ${queue}`, empheral: true });
        } catch (error) {
            if (error instanceof UserError) {
                return await client.utils.embeds.SimpleEmbed(interaction, { title: "Command Execution failed", text: error.message, empheral: true });
            } else {
                return await client.utils.embeds.SimpleEmbed(interaction, { title: "Command Execution failed", text: "Could not perform command: Internal Server Error!", empheral: true });
            }
        }
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;
