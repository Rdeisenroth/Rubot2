import {
    ApplicationCommandOptionType,
    Message,
} from "discord.js";
import { Command } from "../../../typings";
import QueueInfoService from "../../service/queue-info/QueueInfoService";
import { UserError } from "../../service/error/UserError";

const command: Command = {
    name: "remove",
    description: "removes the given text channel as the queue info channel",
    usage: "[channel resolvable]",
    cooldown: 5,
    guildOnly: true,
    defaultPermission: false,
    options: [
        {
            name: "channel",
            description: "the text channels name",
            type: ApplicationCommandOptionType.Channel,
            required: true,
        },
        {
            name: "queue",
            description: "name of the queue",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    execute: async (client, interaction, args) => {
        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            await client.utils.embeds.SimpleEmbed(interaction, { title: "Slash Only Command", text: "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.", deleteinterval: 3000 });
            if (interaction.deletable) await interaction.delete();
            return;
        }
        const member = client.utils.general.getMember(interaction);
        if (!member || member.id !== client.config.get("ownerID") as string) {
            await interaction?.reply("You do not have permission to execute this command.");
            return;
        }

        const g = interaction!.guild!;
        const channel = interaction.options.getChannel("channel", true);
        const queue = interaction.options.getString("queue", true);

        try {
            await QueueInfoService.removeTextChannelAsQueueInfo(g, queue, channel);
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Success", text: `${channel.name} is not a info channel for queue: ${queue} any more`, empheral: true });
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
