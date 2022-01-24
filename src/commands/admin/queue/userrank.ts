import { EmbedFieldData, Message } from "discord.js";
import path from "path";
import { Command } from "../../../../typings";
import GuildSchema from "../../../models/guilds";
import UserSchema from "../../../models/users";
import RoomSchema from "../../../models/rooms";

const command: Command = {
    name: "userrank",
    description: "Lists The first X entries of the Coaching Queue (default: 5)",
    aliases: ["s", "begin", "b"],
    options: [
        {
            name: "queue",
            description: "The Queue",
            type: "STRING",
            required: true,
        },
        {
            name: "amount",
            description: "The Amount of Entries to display (this option will soon be replaced with navigation buttons)",
            type: "INTEGER",
            required: false,
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
        const guildData = (await GuildSchema.findById(g.id));
        if (!guildData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Guild Data Could not be found.", empheral: true });
        }

        const queue = interaction.options.getString("queue", true);
        const queueData = guildData.queues.find(x => x.name.toLowerCase() === queue.toLowerCase());
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Queue Could not be Found.", empheral: true });
        }

        // await g.members.fetch();

        const fields: EmbedFieldData[] = [];
        for (const u of
            (
                await Promise.all(
                    (await UserSchema.find())
                        .map(async x => (
                            {
                                _id: x._id,
                                roomCount: await RoomSchema.getParticipantRoomCount(x._id),
                            }
                        )))
            )
                .sort((x, y) => x.roomCount - y.roomCount).slice(0, 10)
        ) {
            console.log(u._id);
            const member = await g.members.fetch(u._id);
            const roomCount = await RoomSchema.getParticipantRoomCount(u._id);

            fields.push({
                name: member.displayName, value:
                    `-Sprechstunden Beigetreten: ${roomCount}`,
            });
        }

        await client.utils.embeds.SimpleEmbed(interaction, {
            title: "Queue Information",
            text: fields && fields.length ? `Queue Entries of ${queueData.name}` : `Queue ${queueData.name} is empty`,
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