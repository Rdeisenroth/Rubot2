import { Client, ClientEvents } from "discord.js";

/**
 * The Bot Configuration File
 */
export type Configuration = {
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
    (client: Client, ...args: ClientEvents[K]): Promise<boolean>
}