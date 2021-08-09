import ChannelType, { EmojiIdentifierResolvable, MessageEmbed } from "discord.js";
import { Command, RunCommand } from "../../typings";
import GuildSchema, { Guild } from "../models/guilds";
import { VoiceChannel, VoiceChannelDocument } from "../models/voice_channels";
import { VoiceChannelSpawner } from "../models/voice_channel_spawner";

const command: Command = {
    name: 'setjointocreate',
    description: 'sets the given channel as join to create',
    aliases: ['sj2c', 'setj2c'],
    usage: '[channel resolvable]',
    cooldown: 5,
    category: "Miscellaneous",
    guildOnly: true,
    execute: async (client, message, args) => {
        let owner = client.users.cache.find(m => m.id == client.ownerID);
        if (message?.author.id !== client.ownerID as String) {
            return await message?.reply(`You do not have permission to execute this command.`);
        }

        const g = message.guild!;

        // Find channel
        const channel = g!.channels.cache.find(x => x.id == args[0]);
        if (!channel) {
            return await message?.reply(`Channel could not be found.`);
        }

        const updated = await GuildSchema.updateOne(
            { _id: g.id },
            {
                $push: {
                    "voice_channels": {
                        _id: channel.id,
                        channel_type: 2,
                        owner: message.author.id,
                        locked: false,
                        managed: true,
                        // blacklist_user_groups: [],
                        // whitelist_user_groups: [],
                        permitted: [],
                        afkhell: false,
                        spawner: {
                            owner: message.author.id,
                            supervisor_roles: [],
                            permission_overwrites: [{ id: message.guild!.me!.id, allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK'] }],
                            max_users: 5,
                            parent: channel.parentId,
                        },
                    } as VoiceChannel
                }
            },
            { upsert: true, setDefaultsOnInsert: true },
        );
        console.log(updated);
        message.reply("Done.")
        // message.guild?.channels.create("", {})
    }
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;