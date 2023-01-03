// import mongoose from 'mongoose';
import mongoose, { AnyKeys, AnyObject } from "mongoose";
import { Bot } from "../bot";
import GuildSettingsSchema, { GuildSettings, GuildSettingsDocument } from "./guild_settings";
import QueueSchema, { Queue, QueueDocument } from "./queues";
import TextChannelSchema, { TextChannel, TextChannelDocument } from "./text_channels";
import VoiceChannelSchema, { VoiceChannel, VoiceChannelDocument } from "./voice_channels";
import * as djs from "discord.js";
import { ApplicationCommandData, ApplicationCommandOptionChoiceData } from "discord.js";
import { Command, SubcommandHandler } from "../../typings";

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
    /**
     * The Welcome Message Text
     */
    welcome_text?: string,
    /**
     * The Welcome Message Title
     */
    welcome_title?: string,
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
    welcome_text: {
        type: String,
        required: false,
    },
    welcome_title: {
        type: String,
        required: false,
    },
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
    /**
     * Gets the actual guild object represented by this document from discord
     * @param client The Bot Client
     */
    resolve(client: Bot): Promise<djs.Guild | null>,
    /**
     * Posts the Slash Commands to the Guild (using set)
     * @param client The Bot Client
     */
    postSlashCommands(client: Bot): Promise<void>,
    /**
     * Posts the Slash Commands to the Guild (using set)
     * @param client The Bot Client
     * @param g The resolved guild (for speed improvement)
     */
    postSlashCommands(client: Bot, g: djs.Guild): Promise<void>,
    /**
     * Posts the Slash Commands to the Guild (using set)
     * @param g The resolved guild (for speed improvement)
     */
    postSlashCommands(client: Bot, g?: djs.Guild | null): Promise<void>,
    /**
     * Gets all Command Names to append to help Command
     * @param commands The Command Collection of the Guild
     */
    getRecursiveCommandNames(commands: djs.Collection<string, Command>): ApplicationCommandOptionChoiceData[],
    /**
     * Gets the verivied Role
     * @param client The Bot Client
     * @param g The resolved guild (for speed improvement)
     */
    getVerifiedRole(client: Bot, g?: djs.Guild | null | undefined): Promise<djs.Role | null>,
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

GuildSchema.method<GuildDocument>("resolve", async function (client: Bot) {
    return await client.guilds.resolve(this._id);
});

GuildSchema.method<GuildDocument>("getRecursiveCommandNames", function (commands: djs.Collection<string, Command>) {
    const data: ApplicationCommandOptionChoiceData[] = [];
    commands.forEach((val, key) => {
        data.push({ name: key, value: key });
        if ((val as SubcommandHandler).subcommands) {
            data.push(...this.getRecursiveCommandNames((val as SubcommandHandler).subcommands));
        }
    });
    return data;
});

GuildSchema.method<GuildDocument>("getVerifiedRole", async function (client: Bot, g?: djs.Guild | null) {
    g = g ?? (await this.resolve(client))!;
    await g.roles.fetch();
    return g.roles.cache.find(x => x.name.toLowerCase() === "verified") ?? null;
});


GuildSchema.method<GuildDocument>("postSlashCommands", async function (client: Bot, g?: djs.Guild | null) {
    console.log("posting slash commands");
    g = g ?? await this.resolve(client);
    if (!g) {
        throw new Error("Guild could not be resolved!");
    }
    // TODO: Per Guild Slash Command Config
    const data: ApplicationCommandData[] = [];
    // console.log([...client.commands.values()])
    // console.log("posting slash commands");
    for (const c of [...client.commands.values()]) {
        // console.log("a"+ c);
        // Check Database entry
        const cmdSettings = this.guild_settings.getCommandByInternalName(c.name);
        if (cmdSettings?.disabled) {
            continue;
        }
        const commandData: ApplicationCommandData = {
            name: cmdSettings?.name ?? c.name,
            description: cmdSettings?.description ?? c.description,
            options: c.options,
            //defaultPermission: cmdSettings?.defaultPermission ?? c.defaultPermission,
        };
        // Push Options to Help Commands (we do that here because all Commands are loaded at this point)
        if (c.name === "help") {
            const cmdChoices: ApplicationCommandOptionChoiceData[] = client.commands.map((val, key) => {
                return { name: key, value: key };
            });
            (commandData.options![0] as djs.ApplicationCommandChoicesData).choices = cmdChoices;
        }
        data.push(commandData);
        // TODO: Aliases
    }
    try {
        const commands = await g.commands.set(data);
        // // permissions
        // const fullPermissions: djs.GuildApplicationCommandPermissionData[] = [];
        // for (const c of [...commands.values()]) {
        //     const cmdSettings = this.guild_settings.getCommandByGuildName(c.name);
        //     fullPermissions.push({
        //         id: c.id,
        //         permissions: [
        //             // Overwrites von Settings
        //             ...cmdSettings?.getPostablePermissions() ?? [],
        //             // Bot owner
        //             {
        //                 id: client.config.get("ownerID")!,
        //                 type: ApplicationCommandOptionType.User,
        //                 permission: true,
        //             },
        //         ],
        //     });
        // }
        // await g.commands.permissions.set({
        //     fullPermissions: fullPermissions,
        // });

    } catch (error) {
        console.log(error);
    }
});

GuildSchema.static("prepareGuild", async function (client: Bot, g: djs.Guild) {
    console.log(`Processing guild "${g.name}" (${g.id})`);
    let guildData: GuildDocument | null = await this.findById(g.id);
    if (!guildData) {
        const newGuildData = new this<AnyKeys<GuildDocument> & AnyObject>({
            _id: g.id,
            name: g.name,
            member_count: g.memberCount,
            guild_settings: {
                command_listen_mode: 1,
                prefix: "!",
                slashCommands: [],
            } as GuildSettings,
            text_channels: [],
            voice_channels: [],
            queues: [],
        });
        await newGuildData.save();
        guildData = newGuildData as unknown as GuildDocument;
    }
    // Post slash Commands
    await guildData.postSlashCommands(client, g);
});

// Default export
export default mongoose.model<GuildDocument, GuildModel>("Guilds", GuildSchema);