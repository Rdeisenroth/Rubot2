import { BaseEvent } from "../baseEvent";
import { ActivityType, ApplicationCommandData, Guild } from "discord.js";

export default class ReadyEvent extends BaseEvent {
    static name: string = "ready";

    public async execute() {
        await this.registerSlashCommandsForAllGuilds();
        this.setBotPresence();
        this.logStats();
    }

    private loadCommandsData(): ApplicationCommandData[] {
        const commandsData: ApplicationCommandData[] = [];
        for (const command of this.client.commands) {
            const commandData: ApplicationCommandData = {
                name: command.name,
                description: command.description,
                options: command.options,
            };
            commandsData.push(commandData);
        }
        return commandsData;
    }

    private async registerSlashCommandsForAllGuilds() {
        const commandsData = this.loadCommandsData();
        const promises = this.client.guilds.cache.map(async (guild: Guild) => {
            await this.registerSlashCommands(guild, commandsData);
        });
        await Promise.all(promises);
    }

    private async registerSlashCommands(guild: Guild, commandsData: ApplicationCommandData[]): Promise<void> {
        try {
            await guild.commands.set(commandsData);
            this.client.logger.success(`Registered commands in guild ${guild.name}`);
        } catch (error) {
            this.client.logger.error(`Failed to register commands in guild ${guild.name}`);
            throw error;
        }
    }

    private setBotPresence(): void {
        this.client.user?.setPresence({
            status: 'online',
            activities: [{ name: 'Sprechstunden', type: ActivityType.Watching }],
            afk: false
        })
    }

    private logStats(): void {
        const message =
            `"${this.client.user?.username}" is Ready! (${(Date.now() - this.client.initTimestamp) / 1000}s)\n` +
            "-".repeat(26) + "\n" +
            "Bot Stats:\n" +
            `${this.client.users.cache.size} user(s)\n` +
            `${this.client.channels.cache.size} channel(s)\n` +
            `${this.client.guilds.cache.size} guild(s)\n` +
            "=".repeat(26);
        this.client.logger.ready(message);
    }
}