import { Client, Partials, ClientOptions } from 'discord.js'
import { CronJob } from 'cron'
import { ConsolaInstance, createConsola } from 'consola'
import commands from './commands'
import events from './events'
import 'dotenv/config'

/**
 * The main `Bot` class.
 */
export class Bot extends Client {
    /**
     * The logger used by the bot.
     */
    public logger: ConsolaInstance
    // TODO
    // private configManager: ConfigManager  


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
    constructor(options: ClientOptions, token: string) {
        super(options);
        this.token = token
        this.logger = createConsola()
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

    const bot = new Bot(clientOptions, token)
    bot.listen()
    bot.startQueueGuardJob()
}