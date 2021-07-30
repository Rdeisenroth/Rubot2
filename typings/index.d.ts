import { Client, ClientEvents, Collection, Message } from "discord.js";
import { Arguments } from "yargs-parser";
import { Bot } from "../src/bot";

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
    (client: Bot, ...args: ClientEvents[K]): Promise<boolean>
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
        message?: Message,
        /**
         * The Command Arguments
         */
        args: string[]): Promise<any>;
}

/**
 * The Code that's being executed when the Command is initialized
 */
export interface InitCommand {
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
    description?: string;
    /**
     * the Command Cooldown in ms
     */
    cooldown?: number;
    /**
     * Whether the Command requires at least one Argument
     */
    args?: boolean;
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
    init?: InitCommand;
    /**
     * Executes the Command
     */
    execute: RunCommand;
}

export interface SubcommandHandler extends Command {
    /**
     * A Collection of Subcommands, that is expected to be populated after init() was called
     */
    subcommands: Collection<string, Command>;
    /**
     * This Function populates the subcommands field and can do other init stuff
     */
    init: InitCommand;
}