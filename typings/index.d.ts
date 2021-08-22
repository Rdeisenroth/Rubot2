import { ApplicationCommandOptionData, ButtonInteraction as bi, Client, ClientEvents, Collection, CommandInteraction, EmbedFieldData, Interaction, Message, MessageComponentInteraction } from "discord.js";
import { Arguments } from "yargs-parser";
import { Bot } from "../src/bot";
import mongoose from "mongoose";

/**
 * The Bot Configuration File
 */
export type BotConfig = {
    /**
     * the Default Bot Prefix
     */
    prefix: string;
    /**
     * The Discord Bot Token
     */
    token: string;
    /**
     * the Bot owner Client ID
     */
    ownerID: string;
    /**
     * A Configuration File for this Bot
     */
    version: string;
    /**
     * the Current Rocket League Season
     */
    current_season?: string;
    /**
     * the rlstats.net Api Key
     */
    rlstatsapikey?: string;
    /**
     * the Steam API Key
     */
    steamapikey?: string;
    /**
     * the Google Maps API Key
     */
    googlemapsapikey?: string;
    /**
     * the Ballchasing.com API Key
     */
    ballchasingapikey?: string;
    /**
     * the Mysql Host
     */
    mysqlhost: string;
    /**
     * the Mysql User
     */
    mysqluser: string;
    /**
     * the Mysql Password
     */
    mysqlpassword: string;
    /**
     * the Name of the Main MySQL Database / Schema of the Bot
     */
    main_schema_name: string;
    /**
     * the Mongo DB Connection URL
     */
    mongodb_connection_url: string;
};

export abstract class ClientEventListener<K extends keyof ClientEvents> {
    public eventName: K = K;
    static execute: ExecuteEvent<K> = async () => { console.log("unimplemented Event!") };
}

export interface BotEvent<K extends keyof ClientEvents> {
    name: keyof ClientEvents;
    execute: ExecuteEvent<K>;
}

// export interface ExecuteEvent {
//     (client: Client, ...args: any[]): Promise<void>
// }
export interface ExecuteEvent<K extends keyof ClientEvents> {
    (client: Bot, ...args: ClientEvents[K]): Promise<void>
}

/**
 * The Code that's being executed when the Command is run
 */
export interface RunCommand {
    (
        /**
         * the Bot Client Instance
         */
        client: Bot,
        /**
         * The Message that called for the command
         */
        interaction?: Message | CommandInteraction,
        /**
         * The Command Arguments
         */
        args: string[]): Promise<any>;
}
/**
 * The Code that's being executed when the Command is run
 */
export interface RunSlashCommand {
    (
        /**
         * the Bot Client Instance
         */
        client: Bot,
        /**
         * The Message that called for the command
         */
        interaction: CommandInteraction,
        /**
         * The Command Arguments
         */
        args: string[]): Promise<any>;
}
/**
 * The Code that's being executed when the Command is run
 */
export interface RunComponentInteraction {
    (
        /**
         * the Bot Client Instance
         */
        client: Bot,
        /**
         * The Interaction that called the Module
         */
        interaction: MessageComponentInteraction,
    )
}
/**
 * The Code that's being executed when the Command is run
 */
export interface RunButtonInteraction {
    (
        /**
         * the Bot Client Instance
         */
        client: Bot,
        /**
         * The Interaction that called the Module
         */
        interaction: bi,
    )
}

/**
 * The Code that's being executed when the Module is initialized
 */
export interface InitFunction {
    (
        /**
         * the Bot Client Instance
         */
        client: Bot): Promise<any>;
}

/**
 * Definition of a Command for Type Safety
 */
export interface Command {
    /**
     * the Command Name
     */
    name: string;
    /**
     * the Command Aliases
     */
    aliases?: string[];
    /**
     * the Command Description
     */
    description: string;
    /**
     * the Command Cooldown in ms
     */
    cooldown?: number;
    /**
     * Whether the Command requires at least one Argument
     */
    args?: boolean;
    /**
     * Data to parse for slash Commands
     */
    options?: ApplicationCommandOptionData[],
    /**
     * The Paramers after command name surrounded with <>
     */
    usage?: string;
    /**
     * Wheter the Command Can only be executed on Guilds (=Servers)
     */
    guildOnly?: boolean;
    /**
     * the Category of the Command
     */
    category?: string;
    /**
     * Whether the Command should be excluded from the regular Help Command
     */
    invisible?: boolean;
    /**
     * A Function that Is executed before the Command is loaded
     */
    init?: InitFunction;
    /**
     * Executes the Command
     */
    execute: RunCommand;
    /**
     * The Default permission for Discords Command Handler (set to false to disable by default)
     */
    defaultPermission?: boolean;
}

export interface SlashOnlyCommand extends Command {
    execute: RunSlashCommand;
}

export interface SubcommandHandler extends Command {
    /**
     * A Collection of Subcommands, that is expected to be populated after init() was called
     */
    subcommands: Collection<string, Command>;
    /**
     * This Function populates the subcommands field and can do other init stuff
     */
    init: InitFunction;
}

export interface ComponentInteraction {
    /**
     * the Custom ID to listen for
     */
    customID: string;
    /**
     * Aliases for the ID
     */
    aliases?: string[];
    /**
     * a Description of the Interaction
     */
    description?: string;
    /**
     * the Interaction Cooldown in ms
     */
    cooldown?: number;
    /**
     * A Function that Is executed before the Module is loaded
     */
    init?: InitFunction;
    /**
     * Executes the Command
     */
    execute: RunComponentInteraction;
}

/**
 * A Button Interaction
 */
export interface ButtonInteraction extends ComponentInteraction {
    execute: RunButtonInteraction;
}

/**
 * Replacements for String Interpolation
 */
export type StringReplacements = {
    [
    /**
     * The value that will be replaced (use ${<value>} in the string)
     */
    key: string
    ]:
    /**
     * the replacenemt Value
     */
    any
}

export type SimpleEmbedOptions = {
    /**
     * the title of the embed
     */
    title: string,
    /**
     * The text for the Description of the embed
     */
    text?: string,
    /**
     * The Style of the Embed
     */
    style?: number,
    /**
     * Automatically delete message after x milliseconds
     */
    deleteinterval?: number,
    /**
     * The Fields of the Embed
     */
    fields?: EmbedFieldData[],
    /**
     * If the Message should only be visible for the reciever (only works for CommandInteractions)
     */
    empheral?: boolean,
}

/**
 * Simple Type To Export Event Dates
 */
export type EventDate = {
    /**
     * The Event ID
     */
    event_id?: mongoose.Types.ObjectId,
    /**
     * The Target ID
     */
    target_id: string,
    /**
     * The Timestamp
     */
    timestamp: string,
}