import { Client, Collection, TextChannel, VoiceChannel } from "discord.js";
import consola, { Consola } from "consola";
import cron, { CronJob } from "cron";
import { BotConfig, BotEvent, ButtonInteraction, Command } from "../typings";
import glob from "glob";
import { promisify } from "util";
import * as fs from "fs";
import * as utils from "./utils/utils";
import GuildSchema from "./models/guilds";
import parser from "yargs-parser";
import mongoose from "mongoose";
import path from "path/posix";
import G from "glob";
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
    public queue_stays: Collection<string, Collection<string, utils.general.QueueStayOptions>> = new Collection();
    public ownerID?: string;
    public prefix = "!";
    public version = "0.0";
    public utils = utils;
    public parser = parser;
    public database = mongoose;
    public readonly initTimestamp = Date.now();
    public jobs: CronJob[] = [];
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
        this.database = await mongoose.connect(config.mongodb_connection_url, {});
        this.logger.info("connected to DB!!");

        // Event Files
        this.logger.info("Loading Events...");
        const eventFiles = fs.readdirSync(`${__dirname}/events`).filter(file => file.endsWith(".js") || file.endsWith("ts"));
        await eventFiles.map(async (eventFile: string) => {
            const event = (await import(`${__dirname}/events/${eventFile}`)) as BotEvent<any>;
            console.log(`${JSON.stringify(event.name)} (./events/${eventFile})`);
            this.on(event.name, event.execute.bind(null, this));
        });

        // Check for queue Timestamps
        // TODO: not hardcode
        const openShift = -1 * 1000 * 60 * 15; // 15 Minuten Vorlauf
        const closeShift = 0;
        /**
         * Times for opening the queue
         */
        const queue_stamps: utils.general.QueueSpan[] = [
            // Montag
            new utils.general.QueueSpan(
                new utils.general.WeekTimestamp(utils.general.Weekday.MONDAY, 11, 40),
                new utils.general.WeekTimestamp(utils.general.Weekday.MONDAY, 13, 20),
                openShift,
                closeShift,
            ),
            new utils.general.QueueSpan(
                new utils.general.WeekTimestamp(utils.general.Weekday.MONDAY, 16, 15),
                new utils.general.WeekTimestamp(utils.general.Weekday.MONDAY, 17, 55),
                openShift,
                closeShift,
            ),
            // Dienstag
            new utils.general.QueueSpan(
                new utils.general.WeekTimestamp(utils.general.Weekday.TUESDAY, 9, 50),
                new utils.general.WeekTimestamp(utils.general.Weekday.TUESDAY, 11, 30),
                openShift,
                closeShift,
            ),
            new utils.general.QueueSpan(
                new utils.general.WeekTimestamp(utils.general.Weekday.TUESDAY, 16, 15),
                new utils.general.WeekTimestamp(utils.general.Weekday.TUESDAY, 17, 55),
                openShift,
                closeShift,
            ),
            // Mittwoch
            new utils.general.QueueSpan(
                new utils.general.WeekTimestamp(utils.general.Weekday.WEDNESDAY, 11, 40),
                new utils.general.WeekTimestamp(utils.general.Weekday.WEDNESDAY, 13, 20),
                openShift,
                closeShift,
            ),
            new utils.general.QueueSpan(
                new utils.general.WeekTimestamp(utils.general.Weekday.WEDNESDAY, 18, 5),
                new utils.general.WeekTimestamp(utils.general.Weekday.WEDNESDAY, 19, 55),
                openShift,
                closeShift,
            ),
            // Donnerstag
            // new QueueSpan(
            //     new WeekTimestamp(Weekday.THURSDAY, 3, 51),
            //     new WeekTimestamp(Weekday.THURSDAY, 3, 52),
            // ),
            new utils.general.QueueSpan(
                new utils.general.WeekTimestamp(utils.general.Weekday.THURSDAY, 11, 40),
                new utils.general.WeekTimestamp(utils.general.Weekday.THURSDAY, 13, 20),
                openShift,
                closeShift,
            ),
            new utils.general.QueueSpan(
                new utils.general.WeekTimestamp(utils.general.Weekday.THURSDAY, 16, 15),
                new utils.general.WeekTimestamp(utils.general.Weekday.THURSDAY, 17, 55),
                openShift,
                closeShift,
            ),
            // Friday
            new utils.general.QueueSpan(
                new utils.general.WeekTimestamp(utils.general.Weekday.FRIDAY, 9, 50),
                new utils.general.WeekTimestamp(utils.general.Weekday.FRIDAY, 11, 30),
                openShift,
                closeShift,
            ),
            new utils.general.QueueSpan(
                new utils.general.WeekTimestamp(utils.general.Weekday.FRIDAY, 13, 30),
                new utils.general.WeekTimestamp(utils.general.Weekday.FRIDAY, 15, 10),
                openShift,
                closeShift,
            ),
            new utils.general.QueueSpan(
                new utils.general.WeekTimestamp(utils.general.Weekday.FRIDAY, 18, 5),
                new utils.general.WeekTimestamp(utils.general.Weekday.FRIDAY, 19, 55),
                openShift,
                closeShift,
            ),
        ];
        const job = new CronJob("*/30 * * * * *", async () => {
            console.log(new Date().toLocaleString());

            let guildData = await GuildSchema.findById("855035619843112960");
            if (!guildData) {
                return;
            }
            const queueData = guildData.queues.find(x => x.name.toLowerCase() === "FOP-Sprechstunde".toLowerCase());
            if (!queueData) {
                return;
            }
            if (queue_stamps.some(x => x.isActive(new Date())) === queueData.locked) {
                let origState = queueData.locked;
                await queueData.toggleLock();
                console.log(origState ? "Unlocked Queue" : "Locked Queue");
                await this.utils.embeds.SimpleEmbed((await this.channels.fetch("879701388354019388")) as TextChannel, { title: "Sprechstundensystem", text: `Die \`FOP-Sprechstunden\`-Warteschlange wurde ${origState ? "freigeschaltet" : "gesperrt"}.\nEine Übersicht der Zeiten findet sich in den Pins.` });
                try {
                    queueData.getWaitingRooms(guildData).forEach(async x => {
                        const c = (await this.channels.fetch(x._id)) as VoiceChannel;
                        await x.syncPermissions(c, (await guildData!.getVerifiedRole(this, c.guild))?.id || undefined, !origState);
                    });
                } catch (error) {
                    return;
                }
            } else {
                console.log(`queue Still ${queueData.locked ? "locked" : "unlocked"}`);
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
        }, null, true, "America/Los_Angeles");
        job.start();

        const job2 = new CronJob("*/30 * * * * *", async () => {
            // console.log(new Date().toLocaleString());

            let guildData = await GuildSchema.findById("899678380251816036");
            if (!guildData) {
                return;
            }
            const queueData = guildData.queues.find(x => x.name.toLowerCase() === "team1".toLowerCase());
            if (!queueData) {
                return;
            }
            if (queue_stamps.some(x => x.isActive(new Date())) === queueData.locked) {
                let origState = queueData.locked;
                await queueData.toggleLock();
                console.log(origState ? "Unlocked Queue" : "Locked Queue");
                await this.utils.embeds.SimpleEmbed((await this.channels.fetch("899678381082300522")) as TextChannel, { title: "Sprechstundensystem", text: `Die \`FOP-Sprechstunden\`-Warteschlange wurde ${origState ? "freigeschaltet" : "gesperrt"}.\nEine Übersicht der Zeiten findet sich in den Pins.` });
                try {
                    queueData.getWaitingRooms(guildData).forEach(async x => {
                        const c = (await this.channels.fetch(x._id)) as VoiceChannel;
                        await x.syncPermissions(c, (await guildData!.getVerifiedRole(this, c.guild))?.id || undefined, !origState);
                    });
                } catch (error) {
                    return;
                }
            } else {
                console.log(`queue Still ${queueData.locked ? "locked" : "unlocked"}`);
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
        }, null, true, "America/Los_Angeles");
        job2.start();
    }


    // public async createGuildCommand(data:any, guildId:string) {
    //     return await this.api.appl
    // }
}