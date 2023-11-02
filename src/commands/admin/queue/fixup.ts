import { ApplicationCommandOptionType, Message, Role } from "discord.js";
import { Command } from "../../../../typings";
import { GuildModel } from "../../../models/guilds";
import { UserModel } from "../../../models/users";

const command: Command = {
    name: "fixup",
    description: "Fixes Leftover roles and Channels when the bot was offline.",
    aliases: ["s", "begin", "b"],
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

        let faultyRoleCount = 0;
        let as_faultyRoleCount = 0;

        const members = await g.members.fetch();
        const roles = await g.roles.fetch();
        const waiting_role: Role | undefined = roles.find(x => x.name.toLowerCase() === queueData.name.toLowerCase() + "-waiting");
        if (!waiting_role) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Waiting Role Could not be found.", empheral: true });
        }
        const role_members = members.filter(x => x.roles.cache.has(waiting_role.id));
        if (!role_members) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Waiting Role Members Could not be found.", empheral: true });
        }
        const oldMemberCount = role_members.size;
        waiting_role.members.forEach(async m => {
            if (!queueData.contains(m.id)) {
                faultyRoleCount++;
                await m.roles.remove(waiting_role);
            }
        });
        const active_session_role: Role | undefined = roles.find(x => x.name.toLowerCase() === "aktive sprechstunde");
        if (!active_session_role) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Active Session Role Could not be found.", empheral: true });
        }
        const as_role_members = members.filter(x => x.roles.cache.has(active_session_role.id));
        if (!as_role_members) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Active Session Role Members Could not be found.", empheral: true });
        }
        const user = client.utils.general.getUser(interaction);
        const userEntry = await UserModel.findOneAndUpdate({ _id: user.id }, { _id: user.id }, { new: true, upsert: true, setDefaultsOnInsert: true });
        // Check if User has Active Sessions
        const activeSessions = await userEntry.getActiveSessions();
        const as_oldMemberCount = as_role_members.size;
        active_session_role.members.forEach(async m => {
            if (!queueData.contains(m.id)) {
                as_faultyRoleCount++;
                await m.roles.remove(active_session_role);
            }
        });

        await client.utils.embeds.SimpleEmbed(interaction, {
            title: "Queue Fixup",
            text: `${faultyRoleCount ? `Fixed ${faultyRoleCount} roles.` : "Everything Clean."}\n >Old member Count: ${oldMemberCount}.\n >New Member Count: ${oldMemberCount - faultyRoleCount}`,
            empheral: true,
        });
        // client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;