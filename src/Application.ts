import "reflect-metadata"
import 'dotenv/config'
import { Client, Partials, ClientOptions } from 'discord.js'
import { CronJob } from 'cron'
import { ConsolaInstance, createConsola } from 'consola'
import { CommandsManager, ConfigManager, UserManager } from "./managers"
import commands from './commands'
import events from './events'
import { container, delay, inject, injectable, singleton } from "tsyringe"
import Environment from "./Environment"
import mongoose from "mongoose"

/**
 * The main `Application` class.
 */
@injectable()
@singleton()
export class Application {
    public client: Client
    /**
     * The logger used by the bot.
     */
    public logger: ConsolaInstance
    
    /**
     * The config manager responsible for managing the bot config in the database.
     */
    public configManager: ConfigManager  

    /**
     * The user manager responsible for managing the users in the database.
     */
    public userManager: UserManager

    /**
     * The commands manager responsible for managing the bot commands.
     */
    public commandsManager: CommandsManager

    /**
     * The bot token.
     */
    private readonly token: string

    /**
     * Timestamp of bot initialization.
     * 
     * Used to calculate bot startup time.
     */
    readonly initTimestamp = Date.now()
    /**
     * The bot commands.
     */
    public commands = commands
    
    /**
     * Initializes the bot.
     * @param client The Discord client.
     * @param token The bot token.
     */
    constructor(@inject("options") options: ClientOptions, @inject("token") token: string, @inject(delay(() => CommandsManager)) commandsManager: CommandsManager, @inject(delay(() => ConfigManager)) configManager: ConfigManager, @inject(delay(() => UserManager)) userManager: UserManager) {
        this.client = new Client(options)
        this.token = token
        this.logger = createConsola({ level: Environment.logLevel })
        this.commandsManager = commandsManager
        this.configManager = configManager
        this.userManager = userManager
    }

    /**
     * Logs the bot in and starts listening to events.
     * Thereby also registers the bot commands.
     */
    public listen(): void {
        this.logger.info('Listening to events')
        this.registerEvents()
        this.client.login(this.token)
    }

    /**
     * Starts the queue guard job.
     */
    public startQueueGuardJob(): void {
        this.queueGuardJob().start()
    }

    /**
     * Returns the queue guard job.
     * @returns The queue guard job.
     */
    private queueGuardJob(): CronJob<any, any> {
        return new CronJob("*/30 * * * * *", () => {
            // TODO
            this.logger.log('Queue Guard Job')
        })
    }

    /**
     * Connects the application to the database.
     */
    public async connectToDatabase(): Promise<void> {
        this.logger.debug('Connecting to MongoDB')
        mongoose.connect(Environment.monogodbUrl, {})
        mongoose.connection.on("connected", () => {
            this.logger.success('Connected to MongoDB')
        })
    }

    /**
     * Disconnects the application from the database.
     */
    public async disconnectFromDatabase(): Promise<void> {
        this.logger.debug('Disconnecting from MongoDB')
        await mongoose.disconnect()
        this.logger.success('Disconnected from MongoDB')
    }

    /**
     * Registers the bot events.
     */
    private registerEvents() {
        this.logger.info('Registering events')
        for (const event of events) {
            const concreteEvent = new event(this)
            this.client.on(event.name, concreteEvent.execute.bind(concreteEvent))
            this.logger.info(`Registered event ${event.name}`)
        }
    }
}

/**
 * Starts the bot.
 */
export default function start() {
    const clientOptions: ClientOptions = {
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
        partials: [Partials.Channel]
    }
    // const configManager = ConfigManager.getInstance()
    const token = process.env.TOKEN

    if (!token) {
        throw new Error('Token not found')
    }

    container.register("options", { useValue: clientOptions })
    container.register("token", { useValue: token })
    const app = container.resolve(Application)
    app.connectToDatabase()
    app.listen()
    app.startQueueGuardJob()
}