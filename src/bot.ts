import { ConfigHandler } from "./handlers/configHandler";
import { Client, Collection, Partials, TextChannel, VoiceChannel } from "discord.js";
import consola, { ConsolaInstance } from "consola";
import { CronJob } from "cron";
import { BotEvent, ButtonInteraction, Command } from "../typings";
import glob from "glob-promise";
import * as fs from "fs";
import * as utils from "./utils/utils";
import { GuildModel } from "./models/guilds";
import parser from "yargs-parser";
import mongoose from "mongoose";
import path from "path/posix";
import { QueueSpan } from "./models/queue_span";
import { WeekTimestamp } from "./models/week_timestamp";
export class Bot extends Client {
    public logger: ConsolaInstance = consola;
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
    public queue_stays: Collection<string, Collection<string, utils.general.QueueStayOptions>> = new Collection();
    public config = ConfigHandler.getInstance();
    public utils = utils;
    public parser = parser;
    public database = mongoose;
    public readonly initTimestamp = Date.now();
    public jobs: CronJob<null, null>[] = [];
    public constructor() {
        super({
            intents: [
                "DirectMessages",
                "DirectMessageReactions",
                "DirectMessageTyping",
                "Guilds",
                "GuildBans",
                "GuildEmojisAndStickers",
                "GuildIntegrations",
                "GuildInvites",
                "GuildMembers",
                "GuildMessages",
                "GuildMessageReactions",
                "GuildMessageTyping",
                // "GuildPresences",
                "GuildVoiceStates",
            ],
            partials: [
                Partials.Channel,
            ],
        });
    }

    /**
     * Starts the Bot
     * @param config The bot Configuration
     */
    public async start(): Promise<void> {
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
        const files = (await glob(dirstring + "/**/*.{js,ts}"));
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
        this.database = await mongoose.connect(this.config.get("mongodb_Connection_url"), {});
        this.logger.info("Connected to DB!!");

        // Event Files
        this.logger.info("Loading Events...");
        const eventFiles = fs.readdirSync(`${__dirname}/events`).filter(file => file.endsWith(".js") || file.endsWith("ts"));
        await Promise.all(eventFiles.map(async (eventFile: string) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const event = (await import(`${__dirname}/events/${eventFile}`)) as BotEvent<any>;
            console.log(`${JSON.stringify(event.name)} (./events/${eventFile})`);
            this.on(event.name, event.execute.bind(null, this));
        }));

        const queueGuardJob = new CronJob("*/30 * * * * *", async () => {
            for (const g of this.guilds.cache.values()) {
                console.log(new Date().toLocaleString());

                const guildData = await GuildModel.findById(g.id);
                if (!guildData) {
                    return;
                }
                for (const queueData of guildData.queues) {
                    if (!queueData.auto_lock) {
                        continue;
                    }

                    if (queueData.opening_times.map(x => new QueueSpan(
                        new WeekTimestamp(x.begin.weekday, x.begin.hour, x.begin.minute),
                        new WeekTimestamp(x.end.weekday, x.end.hour, x.end.minute),
                        x.openShift,
                        x.closeShift,
                        x.startDate,
                        x.endDate,
                    )).some(x => x.isActive(new Date())) === queueData.locked) {
                        const origState = queueData.locked;
                        await queueData.toggleLock();
                        console.log(origState ? `Unlocked Queue ${queueData.name}` : `Locked Queue ${queueData.name}`);
                        if (queueData.text_channel) {
                            await this.utils.embeds.SimpleEmbed((await this.channels.fetch(queueData.text_channel)) as TextChannel, { title: "Sprechstundensystem", text: `Die \`${queueData.name}\`-Warteschlange wurde ${origState ? "freigeschaltet" : "gesperrt"}.\nEine Übersicht der Zeiten findet sich in den Pins.` });
                        }
                        try {
                            queueData.getWaitingRooms(guildData).forEach(async x => {
                                const c = (await this.channels.fetch(x._id)) as VoiceChannel;
                                await x.syncPermissions(c, (await guildData!.getVerifiedRole(this, c.guild))?.id || undefined, !origState);
                            });
                        } catch (error) {
                            return;
                        }
                    } else {
                        console.log(`queue Still ${queueData.locked ? "locked" : "unlocked"} - ${queueData.name}`);
                    }
                    try {
                        console.log(queueData.locked);
                        queueData.getWaitingRooms(guildData).forEach(async x => {
                            const c = (await this.channels.fetch(x._id)) as VoiceChannel;
                            await x.syncPermissions(c, (await guildData!.getVerifiedRole(this, c.guild))?.id || undefined, queueData.locked);
                        });
                    } catch (error) {
                        return;
                    }
                }
            }
        }, null, true, "America/Los_Angeles");
        queueGuardJob.start();

        this.logger.info("starting Bot...");
        try {
            await this.login(this.config.get("token"));
        } catch (error) {
            this.logger.error("Invalid token", error);
            process.exit(1);
        }

        this.logger.ready(`Bot ${this.user?.displayName} is Ready!`);

        // public async createGuildCommand(data:any, guildId:string) {
        //     return await this.api.appl
        // }
    }
}