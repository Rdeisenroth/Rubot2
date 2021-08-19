// import mongoose from 'mongoose';
import mongoose from "mongoose";
import { Bot } from "../bot";
import GuildSettingsSchema, { GuildSettings, GuildSettingsDocument } from "./guild_settings";
import QueueSchema, { Queue, QueueDocument } from "./queues";
import TextChannelSchema, { TextChannel, TextChannelDocument } from "./text_channels";
import VoiceChannelSchema, { VoiceChannel, VoiceChannelDocument } from "./voice_channels";
import * as djs from 'discord.js';
import { ApplicationCommandData, ApplicationCommandOptionChoice } from "discord.js";

/**
 * A Schema For storing and Managing Guilds
 */
const GuildSchema = new mongoose.Schema<GuildDocument, GuildModel>({
    /**
     * The Guild ID provided by Discord
     */
    _id: {
        type: String,
        required: true
    },
    /**
     * The Name of the Guild
     */
    name: {
        type: String,
        required: true
    },
    /**
     * The Member Count (Makes it easier to sort Guilds by member counts)
     */
    member_count: {
        type: Number,
        required: true,
        default: 0
    },
    /**
     * The Settings for the Guild
     */
    guild_settings: {
        type: GuildSettingsSchema,
        required: true,
    },
    text_channels: [{
        type: TextChannelSchema,
        required: true,
        default: [],
    }],
    voice_channels: [{
        type: VoiceChannelSchema,
        required: true,
        default: [],
    }],
    queues: [{
        type: QueueSchema,
        required: true,
        default: [],
    }]
});

// TODO Find better Names so that they don't conflict with discordjs Interfaces

GuildSchema.static('prepareGuild', async function (client: Bot, g: djs.Guild) {
    console.log(`Processing guild "${g.name}" (${g.id})`);
    const updated = await this.updateOne(
        { _id: g.id },
        {
            $set: {
                _id: g.id,
                name: g.name,
                member_count: g.memberCount,
            }
        },
        { upsert: true, setDefaultsOnInsert: true }
    );
    if (updated.ok) {
        if (updated.upserted) {
            client.logger.info(`Joined new Guild: "${g.name}" (${g.id})`);
        }
        if (updated.nModified > 0) {
            client.logger.info(`Updated Guild: "${g.name}" (${g.id})`);
        }
    } else {
        client.logger.error(JSON.stringify(updated));
    }
    // Post slash Commands
    // TODO: Per Guild Slash Command Config
    const data: ApplicationCommandData[] = [];
    // console.log([...client.commands.values()])
    console.log("hi")
    for (const c of [...client.commands.values()]) {
        // console.log("a"+ c);
        let commandData: ApplicationCommandData = {
            name: c.name,
            description: c.description,
            options: c.options,
            defaultPermission: c.defaultPermission,
        }
        // Push Options to Help Commands (we do that here because all Commands are loaded at this point)
        if (c.name === "help") {
            let cmdChoices: ApplicationCommandOptionChoice[] = client.commands.map((val, key) => {
                return { name: key, value: key }
            });
            commandData.options![0].choices = cmdChoices;
        }
        data.push(commandData)
    }
    try {
        const commands = await g.commands.set(data);
        // permissions
        // for(const c of [...commands.values()]){
        //     await c.permissions.add({permissions: [{
        //         id: client.ownerID!,
        //         type: "USER",
        //         permission: true,
        //     }]})
        // }
    } catch (error) {
        console.log(error);
    }
    // console.log(command);
})

/**
 * A Guild from the Database
 */
export interface Guild {
    name: String,
    member_count: number,
    guild_settings: GuildSettings,
    text_channels: TextChannel[],
    voice_channels: VoiceChannel[],
    queues: Queue[],
}

export interface GuildDocument extends Guild, mongoose.Document {
    // List getters or non model methods here
    text_channels: TextChannelDocument[],
    voice_channels: VoiceChannel[],
    guild_settings: GuildSettingsDocument,
    // queues: QueueDocument[],
}

export interface GuildModel extends mongoose.Model<GuildDocument> {
    // List Model methods here
    /**
     * Processes A Guild by updating the database and posting Slash Commands
     * @param client The Bot Client
     * @param g the guild Object
     */
    prepareGuild(client: Bot, g: djs.Guild): Promise<void>,
}

// Default export
export default mongoose.model<GuildDocument, GuildModel>("Guilds", GuildSchema);