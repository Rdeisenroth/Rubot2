import { Client, Collection, Message } from "discord.js";
import consola, { Consola } from 'consola';
import { BotConfig, BotEvent, Command } from "../typings";
import glob from 'glob';
import { promisify } from "util";
import * as fs from "fs";
import * as utils from "./utils/utils";
const globPromise = promisify(glob);
export class Bot extends Client {
    public logger: Consola = consola;
    public commands: Collection<string, Command> = new Collection();
    // public aliases: Collection<string,string> = new Collection();
    public cooldowns: Collection<string, Collection<string, number>> = new Collection();
    public ownerID?: string;
    public prefix: string = "!";
    public utils = utils;
    public constructor() {
        super();
    }

    /**
     * Starts the Bot
     * @param config The bot Configuration
     */
    public async start(config: BotConfig): Promise<void> {
        this.logger.info("starting Bot...")
        // Read config
        this.ownerID = config.ownerID;
        this.prefix = config.prefix;
        this.login(config.token).catch((e) => this.logger.error(e));

        // Commands
        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
        //iterate over all the commands to store them in a collection
        for (const file of commandFiles) {
            const command: Command = require(`./commands/${file}`);
            console.log(`command: ${file}, name: ${JSON.stringify(command.name)}`)
            // set a new item in the Collection
            // with the key as the command name and the value as the exported module
            this.commands.set(command.name, command);
        }

        // Events
        const eventFiles: string[] = await globPromise(
            `${__dirname}/events/**/*{.js,.ts}`
        );
        eventFiles.map(async (eventFile: string) => {
            const event = (await import(eventFile)) as BotEvent<any>;
            console.log(`file: ${eventFile}, name: ${JSON.stringify(event.name)}`);
            this.on(event.name, event.execute.bind(null, this));
        });
    }
}