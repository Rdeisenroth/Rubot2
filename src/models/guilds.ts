import { Bot } from "../bot";
import { Queue } from "./queues";
import { TextChannel } from "./text_channels";
import { VoiceChannel } from "./voice_channels";
import * as djs from "discord.js";
import { ApplicationCommandData, ApplicationCommandOptionChoiceData } from "discord.js";
import { prop, getModelForClass, DocumentType, ReturnModelType, SubDocumentType, ArraySubDocumentType, mongoose } from "@typegoose/typegoose";
import { Command, SubcommandHandler } from "../../typings";
import { GuildSettings } from "./guild_settings";

/**
 * A Guild from the Database
 */
export class Guild {
    /**
     * The Guild ID provided by Discord
     */
    @prop({ required: true })
        _id!: string;
    /**
     * The Name of the Guild
     */
    @prop({ required: true })
        name!: string;
    /**
     * The Member Count (Makes it easier to sort Guilds by member counts)
     */
    @prop({ required: true, default: 0 })
        member_count!: number;
    /**
     * The Settings for the Guild
     */
    @prop({ required: true, type: () => GuildSettings })
        guild_settings!: SubDocumentType<GuildSettings>;
    /**
     * The Relevant Text Channels of the Guild
     */
    @prop({ required: true, default: [], type: () => [TextChannel] })
        text_channels!: mongoose.Types.DocumentArray<ArraySubDocumentType<TextChannel>>;
    /**
     * The Relevant Voice Channels of the Guild
     */
    @prop({ required: true, default: [], type: () => [VoiceChannel] })
        voice_channels!: mongoose.Types.DocumentArray<ArraySubDocumentType<VoiceChannel>>;
    /**
     * The Queues of the Guild
     */
    @prop({ required: true, default: [], type: () => [Queue] })
        queues!: mongoose.Types.DocumentArray<ArraySubDocumentType<Queue>>;
    /**
     * The Welcome Message Text
     */
    @prop()
        welcome_text?: string;
    /**
     * The Welcome Message Title
     */
    @prop()
        welcome_title?: string;
    /**
     * Gets the actual guild object represented by this document from discord
     * @param client The Bot Client
     */
    public async resolve(this:DocumentType<Guild>, client: Bot): Promise<djs.Guild | null>{
        return await client.guilds.resolve(this._id);
    }
    /**
     * Posts the Slash Commands to the Guild (using set)
     * @param client The Bot Client
     */
    public async postSlashCommands(this: DocumentType<Guild>, client: Bot): Promise<void>;
    /**
     * Posts the Slash Commands to the Guild (using set)
     * @param client The Bot Client
     * @param g The resolved guild (for speed improvement)
     */
    public async postSlashCommands(this: DocumentType<Guild>, client: Bot, g: djs.Guild): Promise<void>;
    /**
     * Posts the Slash Commands to the Guild (using set)
     * @param g The resolved guild (for speed improvement)
     */
    public async postSlashCommands(this: DocumentType<Guild>, client: Bot, g?: djs.Guild | null): Promise<void>{
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
    }
    /**
     * Gets all Command Names to append to help Command
     * @param commands The Command Collection of the Guild
     */
    public getRecursiveCommandNames(this: DocumentType<Guild>, commands: djs.Collection<string, Command>): ApplicationCommandOptionChoiceData[]{
        const data: ApplicationCommandOptionChoiceData[] = [];
        commands.forEach((val, key) => {
            data.push({ name: key, value: key });
            if ((val as SubcommandHandler).subcommands) {
                data.push(...this.getRecursiveCommandNames((val as SubcommandHandler).subcommands));
            }
        });
        return data;
    }
    /**
     * Gets the verivied Role
     * @param client The Bot Client
     * @param g The resolved guild (for speed improvement)
     */
    public async getVerifiedRole(this: DocumentType<Guild>, client: Bot, g?: djs.Guild | null | undefined): Promise<djs.Role | null>{
        g = g ?? (await this.resolve(client))!;
        await g.roles.fetch();
        return g.roles.cache.find(x => x.name.toLowerCase() === "verified") ?? null;
    }

    /**
     * Processes A Guild by updating the database and posting Slash Commands
     * @param client The Bot Client
     * @param g the guild Object
     */
    public static async prepareGuild(this: ReturnModelType<typeof Guild>, client: Bot, g: djs.Guild): Promise<void>{
        console.log(`Processing guild "${g.name}" (${g.id})`);
        let guildData: DocumentType<Guild> | null = await this.findById(g.id);
        if (!guildData) {
            const newGuildData = new GuildModel({
                _id: g.id,
                name: g.name,
                member_count: g.memberCount,
                guild_settings: {
                    command_listen_mode: 1,
                    prefix: "!",
                    slashCommands: [],
                },
                text_channels: [],
                voice_channels: [],
                queues: [],
            });
            await newGuildData.save();
            guildData = newGuildData;
        }
        // Post slash Commands
        await guildData.postSlashCommands(client, g);
    }
}

export const GuildModel = getModelForClass(Guild, {
    schemaOptions: {
        autoCreate: true,
    },
});