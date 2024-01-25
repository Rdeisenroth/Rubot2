import { BaseEvent } from "@baseEvent";
import { ActivityType, Guild } from "discord.js";

export default class ReadyEvent extends BaseEvent {
    static name: string = "ready";

    public async execute() {
        await this.prepareAllGuilds();
        this.setBotPresence();
        this.logStats();
    }

    private async prepareAllGuilds(): Promise<void> {
        const promises = this.app.client.guilds.cache.map(async (guild: Guild) => {
            await this.prepareGuild(guild);
        });
        await Promise.all(promises);
    }

    private async prepareGuild(guild: Guild): Promise<void> {
        await this.app.configManager.getGuildConfig(guild);
        await this.app.commandsManager.registerSlashCommandsFor(guild);
    }

    private setBotPresence(): void {
        this.app.client.user?.setPresence({
            status: 'online',
            activities: [{ name: 'Sprechstunden', type: ActivityType.Watching }],
            afk: false
        })
    }

    private logStats(): void {
        const message =
            `"${this.app.client.user?.username}" is Ready! (${(Date.now() - this.app.initTimestamp) / 1000}s)\n` +
            "  " + "-".repeat(26) + "\n" +
            "  Bot Stats:\n" +
            `  ${this.app.client.users.cache.size} user(s)\n` +
            `  ${this.app.client.channels.cache.size} channel(s)\n` +
            `  ${this.app.client.guilds.cache.size} guild(s)\n` +
            "  " + "=".repeat(26);
        this.app.logger.ready(message);
    }
}