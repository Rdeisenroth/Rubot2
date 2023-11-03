import { ApplicationCommandOptionType, Message } from "discord.js";
import { Command } from "../../../../typings";
import { GuildModel } from "../../../models/guilds";

const command: Command = {
    name: "autolock",
    description: "Enables or disables queue auto locking",
    aliases: ["ac"],
    cooldown: 3000,
    guildOnly: true,
    options: [
        {
            name: "queue",
            description: "A Queue",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
        {
            name: "enable",
            description: "Whether to enable or disable auto locking",
            type: ApplicationCommandOptionType.Boolean,
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

        const guildData = (await GuildModel.findById(g.id))!;
        const queueName = interaction.options.getString("queue", true);
        const enable = interaction.options.getBoolean("enable", true);
        const queueData = guildData.queues.find(x => x.name.toLowerCase() === queueName.toLowerCase());
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Server config", text: `:X: Error: Queue ${queueName} was not found.`, empheral: true });
        }
        const prevState = queueData.auto_lock;

        queueData.auto_lock = enable;
        await guildData.save();
        return await client.utils.embeds.SimpleEmbed(interaction, { title: "Server Config", text: `Successfully \`${enable ? "enabled" : "disabled"}\` auto locking for queue ${queueName}. (previous state ${prevState ? "enabled" : "disabled"})` });
        // client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;