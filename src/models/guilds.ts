// import mongoose from 'mongoose';
import mongoose from "mongoose";
import { Bot } from "../bot";
import GuildSettingsSchema, { GuildSettings, GuildSettingsDocument } from "./guild_settings";
import QueueSchema, { Queue, QueueDocument } from "./queues";
import TextChannelSchema, { TextChannel, TextChannelDocument } from "./text_channels";
import VoiceChannelSchema, { VoiceChannel, VoiceChannelDocument } from "./voice_channels";
import * as djs from "discord.js";
import { ApplicationCommandData, ApplicationCommandOptionChoice } from "discord.js";

/**
 * A Guild from the Database
 */
export interface Guild {
    /**
     * The Guild ID provided by Discord
     */
    _id: string,
    /**
     * The Name of the Guild
     */
    name: string,
    /**
     * The Member Count (Makes it easier to sort Guilds by member counts)
     */
    member_count: number,
    /**
     * The Settings for the Guild
     */
    guild_settings: GuildSettings,
    /**
     * The Relevant Text Channels of the Guild
     */
    text_channels: TextChannel[],
    /**
     * The Relevant Voice Channels of the Guild
     */
    voice_channels: VoiceChannel[],
    /**
     * The Queues of the Guild
     */
    queues: Queue[],
}

/**
 * A Schema For storing and Managing Guilds
 */
const GuildSchema = new mongoose.Schema<GuildDocument, GuildModel, Guild>({
    _id: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    member_count: {
        type: Number,
        required: true,
        default: 0,
    },
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
    }],
});

/**
 * A Guild Document as stored in the Database
 */
export interface GuildDocument extends Guild, Omit<mongoose.Document, "_id"> {
    // List getters or non model methods here
    text_channels: mongoose.Types.DocumentArray<TextChannelDocument>,
    voice_channels: mongoose.Types.DocumentArray<VoiceChannelDocument>,
    guild_settings: GuildSettingsDocument,
    queues: mongoose.Types.DocumentArray<QueueDocument>,
}

/**
 * A Guild Model
 */
export interface GuildModel extends mongoose.Model<GuildDocument> {
    // List Model methods here
    /**
     * Processes A Guild by updating the database and posting Slash Commands
     * @param client The Bot Client
     * @param g the guild Object
     */
    prepareGuild(client: Bot, g: djs.Guild): Promise<void>,
}

// --Methods--

// TODO Find better Names so that they don't conflict with discordjs Interfaces

GuildSchema.static("prepareGuild", async function (client: Bot, g: djs.Guild) {
    console.log(`Processing guild "${g.name}" (${g.id})`);
    const updated = await this.updateOne(
        { _id: g.id },
        {
            $set: {
                _id: g.id,
                name: g.name,
                member_count: g.memberCount,
            },
        },
        { upsert: true, setDefaultsOnInsert: true },
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
    for (const c of [...client.commands.values()]) {
        // console.log("a"+ c);
        const commandData: ApplicationCommandData = {
            name: c.name,
            description: c.description,
            options: c.options,
            defaultPermission: c.defaultPermission,
        };
        // Push Options to Help Commands (we do that here because all Commands are loaded at this point)
        if (c.name === "help") {
            const cmdChoices: ApplicationCommandOptionChoice[] = client.commands.map((val, key) => {
                return { name: key, value: key };
            });
            (commandData.options![0] as djs.ApplicationCommandChoicesData).choices = cmdChoices;
        }
        data.push(commandData);
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
});

// Default export
export default mongoose.model<GuildDocument, GuildModel>("Guilds", GuildSchema);