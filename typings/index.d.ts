import { Client, ClientEvents, Message } from "discord.js";
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

export interface RunCommand {
    (client: Bot, message: Message, args: string[]):Promise<any>;
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
     * Executes the Command
     */
    execute: RunCommand;
}