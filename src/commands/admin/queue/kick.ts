import { EmbedFieldData, Message } from "discord.js";
import path from "path";
import { Command } from "../../../../typings";
import GuildSchema from "../../../models/guilds";
import UserSchema from "../../../models/users";

const command: Command = {
    name: "kick",
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
            name: "user",
            description: "The User to kick",
            type: "USER",
            required: true,
        },
        {
            name: "reason",
            description: "A Reason String",
            type: "STRING",
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

        const queueName = interaction.options.getString("queue", true);
        const queueData = guildData.queues.find(x => x.name.toLowerCase() === queueName.toLowerCase());
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: `Queue ${queueName} could not be fould.`, empheral: true });
        }

        // Kick
        let user = interaction.options.getUser("user", true);
        let reason = interaction.options.getString("reason", false);
        user = await user.fetch();
        let member = await interaction.guild!.members.fetch(user);
        // let entry = queueData.getEntry(user.id);
        // queueData.leave()
        try {
            await queueData.leave(user.id);
            // Kick off Channel
            const vc = guildData.voice_channels.id(member.voice.channelId);
            if (vc && vc.queue && vc.queue.equals(queueData._id)) {
                try {
                    await member.voice.setChannel(null);
                } catch (error) {
                    console.log(`Failed to set Voice Channel=null for ${member}`);
                }
            }
            const dmChannel = await user.createDM();
            await client.utils.embeds.SimpleEmbed(dmChannel, { title: "Coaching System", text: "You were Kicked from the Queue by an Administrator." + (reason ? `\nReason: ${reason}` : "") });
        } catch (error) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: `${error}`, empheral: true });
        }

        await client.utils.embeds.SimpleEmbed(interaction, {
            title: "Coaching System",
            text: `Kicked ${user} from the ${queueData.name}-Queue`,
            empheral: true,
        });
        // client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;