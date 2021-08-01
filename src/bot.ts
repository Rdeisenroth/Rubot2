import { Client, Collection, Message } from "discord.js";
import consola, { Consola } from 'consola';
import { BotConfig, BotEvent, Command } from "../typings";
// import glob from 'glob';
import { promisify } from "util";
import * as fs from "fs";
import * as utils from "./utils/utils";
import parser from 'yargs-parser';
import mongoose from 'mongoose';
// const globPromise = promisify(glob);
export class Bot extends Client {
    public logger: Consola = consola;
    public commands: Collection<string, Command> = new Collection();
    // public aliases: Collection<string,string> = new Collection();
    public cooldowns: Collection<string, Collection<string, number>> = new Collection();
    public ownerID?: string;
    public prefix: string = "!";
    public utils = utils;
    public parser = parser;
    public database = mongoose;
    public readonly initTimestamp = Date.now();
    public constructor() {
        super();
    }

    /**
     * Starts the Bot
     * @param config The bot Configuration
     */
    public async start(config: BotConfig): Promise<void> {
        this.logger.info("starting Bot...");
        // Read config
        this.ownerID = config.ownerID;
        this.prefix = config.prefix;
        this.login(config.token).catch((e) => this.logger.error(e));

        // Commands
        this.logger.info("Loading Commands...");
        const commandFiles = fs.readdirSync(`${__dirname}/commands`).filter(file => file.endsWith('.js') || file.endsWith('ts'));
        // console.log("Command Files:" + JSON.stringify(commandFiles));
        //iterate over all the commands to store them in a collection
        for (const file of commandFiles) {
            const command: Command = await import(`${__dirname}/commands/${file}`);
            console.log(`-${JSON.stringify(command.name)} ($./commands/${file})`);
            // set a new item in the Collection
            // with the key as the command name and the value as the exported module
            this.commands.set(command.name, command);
            // Let The initialisation Code completely run before continuing
            if (command.init) {
                let initPromise = command.init(this);
                while (initPromise instanceof Promise) {
                    initPromise = await initPromise;
                }
            }
        }

        // Event Files
        this.logger.info("Loading Events...");
        const eventFiles = fs.readdirSync(`${__dirname}/events`).filter(file => file.endsWith('.js') || file.endsWith('ts'));
        await eventFiles.map(async (eventFile: string) => {
            const event = (await import(`${__dirname}/events/${eventFile}`)) as BotEvent<any>;
            console.log(`${JSON.stringify(event.name)} (./events/${eventFile})`);
            this.on(event.name, event.execute.bind(null, this));
        });

        // Connect to db
        mongoose.connect(
            config.mongodb_connection_url,
            { useNewUrlParser: true, useUnifiedTopology: true },
            (err) => {
                if (err) {
                    throw err;
                } else {
                    this.logger.info('connected to DB!!');
                }
            }
        );
    }

    // public async createGuildCommand(data:any, guildId:string) {
    //     return await this.api.appl
    // }
}