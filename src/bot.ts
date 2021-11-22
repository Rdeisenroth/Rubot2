/**
 * The Possible Annotations for queue Stayings
 */
export enum QueueStayOptions {
    /**
     * Annotates that a queue State Decision is Pending
     */
    PENDING,
    /**
     * Annotates a stay
     */
    STAY,
    /**
     * Annotates user already left
     */
    LEFT,
}
import { Client, Collection } from "discord.js";
import consola, { Consola } from "consola";
import { BotConfig, BotEvent, ButtonInteraction, Command } from "../typings";
import glob from "glob";
import { promisify } from "util";
import * as fs from "fs";
import * as utils from "./utils/utils";
import parser from "yargs-parser";
import mongoose from "mongoose";
import path from "path/posix";
const globPromise = promisify(glob);
export class Bot extends Client {
    public logger: Consola = consola;
    public commands: Collection<string, Command> = new Collection();
    public componentInteractions: { buttons: Collection<string, ButtonInteraction> } = { buttons: new Collection() };
    // public aliases: Collection<string,string> = new Collection();
    public cooldowns: Collection<string, Collection<string, number>> = new Collection();
    /**
     * A Collection Of Queue Stays. The First string is the member id, the second string is the Queue id.
     *
     * @type {Collection<string, Collection<string, QueueStayOptions>>} A Collection of Queue Stays
     * @memberof Bot
     */
    public queue_stays: Collection<string, Collection<string, QueueStayOptions>> = new Collection();
    public ownerID?: string;
    public prefix = "!";
    public version = "0.0";
    public utils = utils;
    public parser = parser;
    public database = mongoose;
    public readonly initTimestamp = Date.now();
    public constructor() {
        super({
            intents: [
                "DIRECT_MESSAGES",
                "DIRECT_MESSAGE_REACTIONS",
                "DIRECT_MESSAGE_TYPING",
                "GUILDS",
                "GUILD_BANS",
                "GUILD_EMOJIS_AND_STICKERS",
                "GUILD_INTEGRATIONS",
                "GUILD_INVITES",
                "GUILD_MEMBERS",
                "GUILD_MESSAGES",
                "GUILD_MESSAGE_REACTIONS",
                "GUILD_MESSAGE_TYPING",
                // "GUILD_PRESENCES",
                "GUILD_VOICE_STATES"],
            partials: [
                "CHANNEL",
            ],
        });
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
        this.version = config.version;
        this.login(config.token).catch((e) => this.logger.error(e));

        // Commands
        this.logger.info("Loading Commands...");
        const commandFiles = fs.readdirSync(`${__dirname}/commands`).filter(file => file.endsWith(".js") || file.endsWith("ts"));
        // console.log("Command Files:" + JSON.stringify(commandFiles));
        //iterate over all the commands to store them in a collection
        for (const file of commandFiles) {
            const command: Command = await import(`${__dirname}/commands/${file}`);
            console.log(`-${JSON.stringify(command.name)} (./commands/${file})`);
            // Check Command Name
            if (command.name !== command.name.toLowerCase() || !command.name.match("^[\\w-]{1,32}$")) {
                throw new Error(`Invalid Command Name at ./commands/${file}: ${command.name}\nCommand Names must be all lowercase and must match ^[\\w-]{1,32}$`);
            }
            // Check Command Description
            if (command.description.length < 1 || command.description.length > 100) {
                throw new Error(`Invalid Command Description for ${command.name} at ./commands/${file}\nDescription Must be 1-100 Characters Long`);
            }
            if (command.options) {
                // Check Command Options
                for (const opt of command.options) {
                    if (opt.name !== opt.name.toLowerCase() || !opt.name.match("^[\\w-]{1,32}$")) {
                        throw new Error(`Invalid Option Name: ${opt.name} at ./commands/${file}\nOption Names must be all lowercase and must match ^[\\w-]{1,32}$`);
                    }
                }
            }
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

        // Interactions
        this.logger.info("Loading Interactions...");
        // TODO: Slect Menus
        const dirstring = `${__dirname}/componentInteractions/buttons`;
        const files = (await globPromise(dirstring + "/**/*.{js,ts}"));
        // console.log("Files:" + JSON.stringify(files));
        //iterate over all the Interactions to store them in a collection
        for (const file of files) {
            // .map(x => path.basename(x, path.extname(x)));
            const interaction: ButtonInteraction = await import(file);
            console.log(`-${JSON.stringify(interaction.customID)} (./${path.relative(__dirname, file)})`);
            // set a new item in the Collection
            // with the key as the command name and the value as the exported module
            this.componentInteractions.buttons.set(interaction.customID, interaction);
            // Let The initialisation Code completely run before continuing
            if (interaction.init) {
                let initPromise = interaction.init(this);
                while (initPromise instanceof Promise) {
                    initPromise = await initPromise;
                }
            }
        }

        // Connect to db
        mongoose.connect(
            config.mongodb_connection_url,
            {},
            (err) => {
                if (err) {
                    throw err;
                } else {
                    this.logger.info("connected to DB!!");
                }
            },
        );

        // Event Files
        this.logger.info("Loading Events...");
        const eventFiles = fs.readdirSync(`${__dirname}/events`).filter(file => file.endsWith(".js") || file.endsWith("ts"));
        await eventFiles.map(async (eventFile: string) => {
            const event = (await import(`${__dirname}/events/${eventFile}`)) as BotEvent<any>;
            console.log(`${JSON.stringify(event.name)} (./events/${eventFile})`);
            this.on(event.name, event.execute.bind(null, this));
        });
    }

    // public async createGuildCommand(data:any, guildId:string) {
    //     return await this.api.appl
    // }
}