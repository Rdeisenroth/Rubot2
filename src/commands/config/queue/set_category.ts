import { VoiceChannelSpawner } from "./../../../models/voice_channel_spawner";
import { SlashCommandPermission } from "./../../../models/slash_command_permission";
import { ApplicationCommandOptionType, Message, Role } from "discord.js";
import { Command } from "../../../../typings";
import GuildSchema from "../../../models/guilds";

const command: Command = {
    name: "set_category",
    description: "Sets the category channel",
    aliases: ["s"],
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
            name: "category",
            description: "A Category channel",
            type: ApplicationCommandOptionType.Channel,
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

        const guildData = (await GuildSchema.findById(g.id))!;
        const queueName = interaction.options.getString("queue", true);
        const category = interaction.options.getChannel("category", true);
        const queueData = guildData.queues.find(x => x.name.toLowerCase() === queueName.toLowerCase());
        if (!queueData) {
            return await client.utils.embeds.SimpleEmbed(interaction, { title: "Server config", text: `:X: Error: Queue ${queueName} was not found.`, empheral: true });
        }

        if (queueData.room_spawner) {
            queueData.room_spawner.parent = category.id;
            queueData.room_spawner.max_users = 5;
            queueData.room_spawner.lock_initially = true;
            queueData.room_spawner.hide_initially = true;
        } else {
            queueData.set("room_spawner", {
                permission_overwrites: [],
                supervisor_roles: [],
                parent: category.id,
                max_users: 5,
                lock_initially: true,
            } as VoiceChannelSpawner);
        }
        await guildData.save();
        await guildData.postSlashCommands(client, g);
        return await client.utils.embeds.SimpleEmbed(interaction, { title: "Server Config", text: `Successfully updated The Category for Queue ${queueData.name}` });
        // client.utils.embeds.SimpleEmbed(interaction, "TODO", `Command \`${path.relative(process.cwd(), __filename)}\` is not Implemented Yet.`);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;