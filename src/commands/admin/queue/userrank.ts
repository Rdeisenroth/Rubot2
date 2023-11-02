import { ApplicationCommandOptionType, EmbedField, Message } from "discord.js";
import { Command } from "../../../../typings";
import { GuildModel } from "../../../models/guilds";
import { UserModel } from "../../../models/users";
import { RoomModel } from "../../../models/rooms";

const command: Command = {
    name: "userrank",
    description: "Lists The first X entries of the Coaching Queue (default: 5)",
    aliases: ["s", "begin", "b"],
    options: [
        {
            name: "queue",
            description: "The Queue",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "amount",
            description: "The Amount of Entries to display (this option will soon be replaced with navigation buttons)",
            type: ApplicationCommandOptionType.Integer,
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
        const guildData = (await GuildModel.findById(g.id));
        if (!guildData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Guild Data Could not be found.", empheral: true });
        }

        const queue = interaction.options.getString("queue", true);
        const queueData = guildData.queues.find(x => x.name.toLowerCase() === queue.toLowerCase());
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Queue Could not be Found.", empheral: true });
        }

        // await g.members.fetch();

        const fields: EmbedField[] = [];
        const rooms = await RoomModel.find({});
        for (const u of
            (
                await Promise.all(
                    (await UserModel.find())
                        .map(async (x, i, a) => {
                            console.log(`Processing User data of ${x._id} (${i}/${a.length})`);
                            return {
                                _id: x._id,
                                roomCount: await RoomModel.getParticipantRoomCount(x._id, rooms),
                            };
                        },
                        ))
            )
                .sort((x, y) => x.roomCount - y.roomCount).slice(0, 10)
        ) {
            // console.log(u._id);
            try {
                const member = await g.members.fetch(u._id);
                const roomCount = u.roomCount;
                fields.push({
                    name: member.displayName, value:
                    `-Sprechstunden Beigetreten: ${roomCount}`,
                    inline: false,
                });
            } catch (error) {
                client.logger.error(`could not get user details for ${u._id}`, error);
                fields.push({
                    name: u._id, value:
                    `-Sprechstunden Beigetreten: ${u.roomCount}`,
                    inline: false,
                });
            }
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