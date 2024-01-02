import { BaseEvent } from "../baseEvent";
import { ActivityType, ApplicationCommandData, Guild } from "discord.js";

export default class ReadyEvent extends BaseEvent {
    static name: string = "ready";

    public async execute() {
        await this.prepareAllGuilds();
        this.setBotPresence();
        this.logStats();
    }

    private async prepareAllGuilds(): Promise<void> {
        const promises = this.client.guilds.cache.map(async (guild: Guild) => {
            await this.prepareGuild(guild);
        });
        await Promise.all(promises);
    }

    private async prepareGuild(guild: Guild): Promise<void> {
        await this.client.configManager.getGuildConfig(guild);
        await this.client.commandsManager.registerSlashCommandsFor(guild);
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