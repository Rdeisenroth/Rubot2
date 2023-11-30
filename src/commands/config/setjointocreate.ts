import { ApplicationCommandOptionType, CategoryChannel, GuildChannel, Message, VoiceChannel as dvc } from "discord.js";
import { Command } from "../../../typings";
import { GuildModel } from "../../models/guilds";
import { VoiceChannel } from "../../models/voice_channels";
import { FilterOutFunctionKeys } from "@typegoose/typegoose/lib/types";
import { mongoose } from "@typegoose/typegoose";

const command: Command = {
    name: "setjointocreate",
    description: "sets the given channel as join to create",
    aliases: ["sj2c", "setj2c"],
    usage: "[channel resolvable]",
    cooldown: 5,
    category: "Coaching",
    guildOnly: true,
    defaultPermission: false,
    options: [{
        name: "spawner",
        description: "the voice Channel to set as Spawner",
        type: ApplicationCommandOptionType.Channel,
        required: true,
    },
    {
        name: "parent",
        description: "The Parent(Category) Channel to spawn the Channels In",
        type: ApplicationCommandOptionType.Channel,
        required: false,
    }],
    execute: async (client, interaction, args) => {
        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            await client.utils.embeds.SimpleEmbed(interaction, { title: "Slash Only Command", text: "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.", deleteinterval: 3000 });
            if (interaction.deletable) await interaction.delete();
            return;
        }
        const owner = client.users.cache.find(m => m.id == client.config.get("ownerID"));
        const member = client.utils.general.getMember(interaction);
        if (!member || member.id !== client.config.get("ownerID") as string) {
            await interaction?.reply("You do not have permission to execute this command.");
            return;
        }

        const g = interaction!.guild!;

        // Find channel
        // const channel = g!.channels.cache.find(x => x.id == args[0]);
        const channel = interaction.options.getChannel("spawner", true);
        if (!channel || !(channel instanceof GuildChannel)) {
            return await interaction?.reply("Channel could not be found.");
        }
        if (!(channel instanceof dvc)) {
            return await interaction?.reply("Spawner channel must be a voice Channel.");
        }

        let parent_id = channel.parentId;

        const parent = interaction.options.getChannel("parent", false);

        if (parent) {
            if (!(parent instanceof CategoryChannel)) {
                return await interaction?.reply("Parent must be a Category Channel.");
            }
            parent_id = parent.id;
        }

        const updated = await GuildModel.updateOne(
            { _id: g.id },
            {
                $push: {
                    "voice_channels": {
                        _id: channel.id,
                        channel_type: 2,
                        owner: member.id,
                        locked: false,
                        temporary: false,
                        managed: true,
                        // blacklist_user_groups: [],
                        // whitelist_user_groups: [],
                        permitted: new mongoose.Types.Array(),
                        afkhell: false,
                        spawner: {
                            owner: member.id,
                            supervisor_roles: new mongoose.Types.Array(),
                            permission_overwrites: [{ id: interaction!.guild!.members.me!.id, allow: ["ViewChannel", "Connect", "Speak", "MoveMembers", "ManageChannels"] }],
                            max_users: 5,
                            parent: parent_id,
                        },
                    } as FilterOutFunctionKeys<VoiceChannel>,
                },
            },
            { upsert: true, setDefaultsOnInsert: true },
        );
        console.log(updated);
        interaction!.reply({ content: "Done." });
        // message.guild?.channels.create("", {})
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;