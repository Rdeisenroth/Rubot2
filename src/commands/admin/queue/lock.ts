import { ApplicationCommandOptionType, Message, VoiceChannel } from "discord.js";
import { Command } from "../../../../typings";
import { GuildModel } from "../../../models/guilds";

const command: Command = {
    name: "lock",
    description: "Locks the Queue and disables the /queue join command",
    options: [
        {
            name: "queue",
            description: "The Queue",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    execute: async (client, interaction, args) => {
        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, "Slash Only Command", "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.");
            return;
        }

        await interaction.deferReply();

        const g = interaction.guild!;
        const guildData = (await GuildModel.findById(g.id));
        if (!guildData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Guild Data Could not be found.", empheral: true });
        }

        const queueName = interaction.options.getString("queue", true);
        const queueData = guildData.queues.find(x => x.name.toLowerCase() === queueName.toLowerCase());
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: `Queue ${queueName} could not be fould.`, empheral: true });
        }

        // Lock
        await queueData.lock();
        try {
            queueData.getWaitingRooms(guildData).forEach(async x => await x.lock(await g.channels.fetch(x._id) as VoiceChannel, (await guildData.getVerifiedRole(client, g))?.id || undefined));
        } catch (error) {
            return await client.utils.embeds.SimpleEmbed(interaction, {
                title: "Coaching System - Error",
                text: `:x: Queue ${queueData.name}-could not be locked:\n${error}`,
                empheral: true,
            });
        }

        await client.utils.embeds.SimpleEmbed(interaction, {
            title: "Coaching System",
            text: `Queue ${queueData.name}-was locked.`,
            empheral: true,
        });
        // client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;