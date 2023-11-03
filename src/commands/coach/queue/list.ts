import { ApplicationCommandOptionType, EmbedField, Message } from "discord.js";
import { Command } from "../../../../typings";
import { GuildModel } from "../../../models/guilds";
import { UserModel } from "../../../models/users";

const command: Command = {
    name: "list",
    description: "Lists The first X entries of the Coaching Queue (default: 5)",
    aliases: ["s", "begin", "b"],
    options: [{
        name: "amount",
        description: "The Amount of Entries to display (this option will soon be replaced with navigation buttons)",
        type: ApplicationCommandOptionType.Integer,
        required: false,
    }],
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

        const user = client.utils.general.getUser(interaction);
        const userEntry = await UserModel.findOneAndUpdate({ _id: user.id }, { _id: user.id }, { new: true, upsert: true, setDefaultsOnInsert: true });
        // Check if User has Active Sessions
        const activeSessions = await userEntry.getActiveSessions();
        // We expect at most 1 active session per guild
        const coachingSession = activeSessions.find(x => x.guild && x.guild === g.id);
        if (!coachingSession) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "You Have no Active Coaching Session.", empheral: true });
        }
        if (!coachingSession.queue) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "There is no Queue Linked to your Session.", empheral: true });
        }

        const queue = coachingSession.queue;
        const queueData = guildData.queues.id(queue);
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Coaching System", text: "Queue Could not be Found.", empheral: true });
        }

        // await g.members.fetch();

        const fields: EmbedField[] = [];
        for (const e of queueData.getSortedEntries(10)) {
            const position = queueData.getPosition(e.discord_id) + 1;
            const joined_at = `<t:${Math.round((+e.joinedAt) / 1000)}:f>`;
            const intent = e.intent;
            const member = await g.members.fetch(e.discord_id);
            fields.push({
                name: member.displayName, value:
                    `-Position: ${position}`
                    + `\n-joined at: ${joined_at}`
                    + (intent ? `\n-intent: ${intent}` : ""),
                inline: false,
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