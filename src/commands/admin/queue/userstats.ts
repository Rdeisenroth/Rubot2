import { ApplicationCommandOptionType, EmbedField, Message } from "discord.js";
import { Command } from "../../../../typings";
import { GuildModel } from "../../../models/guilds";
import { RoomModel } from "../../../models/rooms";

const command: Command = {
    name: "userstats",
    description: "Gets Queue Statistics for a given User",
    options: [
        {
            name: "queue",
            description: "The Queue",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "user",
            description: "The User to kick",
            type: ApplicationCommandOptionType.User,
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

        let user = interaction.options.getUser("user", true);
        user = await user.fetch();

        const roomCount = await RoomModel.getParticipantRoomCount(user);

        const fields: EmbedField[] = [
            {
                name: "Total Rooms Participated",
                value: `${roomCount}`,
                inline: false,
            },
        ];
        await client.utils.embeds.SimpleEmbed(interaction, {
            title: "Coaching System",
            text: `${queueData.name}-Queue Stats of User ${user}`,
            empheral: true,
            fields,
        });
        // client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;