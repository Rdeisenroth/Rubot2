import "reflect-metadata"
import 'dotenv/config'
import { Client, Partials, ClientOptions } from 'discord.js'
import { CronJob } from 'cron'
import { ConsolaInstance, createConsola } from 'consola'
import { CommandsManager, ConfigManager } from "./managers"
import commands from './commands'
import events from './events'
import { container, delay, inject, injectable, singleton } from "tsyringe"
import Environment from "./Environment"
import mongoose from "mongoose"
import { exit } from "process"

/**
 * The main `Bot` class.
 */
@injectable()
@singleton()
export class Bot extends Client {
    /**
     * The logger used by the bot.
     */
    public logger: ConsolaInstance
    
    public configManager: ConfigManager  

    public commandsManager: CommandsManager


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
    constructor(@inject("options") options: ClientOptions, @inject("token") token: string, @inject(delay(() => CommandsManager)) commandsManager: CommandsManager, @inject(delay(() => ConfigManager)) configManager: ConfigManager) {
        super(options);
        this.token = token
        this.logger = createConsola({ level: Environment.logLevel })
        this.commandsManager = commandsManager
        this.configManager = configManager
    }

    /**
     * Logs the bot in and starts listening to events.
     * Thereby also registers the bot commands.
     */
    public listen(): void {
        this.logger.info('Listening to events')
        this.registerEvents()
        this.login(this.token!)
    }

    public startQueueGuardJob(): void {
        this.queueGuardJob().start()
    }

    private queueGuardJob(): CronJob<any, any> {
        return new CronJob("*/30 * * * * *", () => {
            // TODO
            this.logger.log('Queue Guard Job')
        })
    }

    public async connectToDatabase(): Promise<void> {
        this.logger.debug('Connecting to MongoDB')
        mongoose.connect(Environment.monogodbUrl, {})
        mongoose.connection.on("connected", () => {
            this.logger.success('Connected to MongoDB')
        })
    }

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
            this.on(event.name, concreteEvent.execute.bind(concreteEvent))
            this.logger.info(`Registered event ${event.name}`)
        }
    }
}

container.registerSingleton(Bot)

export default function initiateBot() {
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
    const bot = container.resolve(Bot)
    // const bot = new Bot(clientOptions, token)
    bot.connectToDatabase()
    bot.listen()
    bot.startQueueGuardJob()
}