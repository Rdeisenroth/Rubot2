import { Guild } from "discord.js";
import { BaseEvent } from "@baseEvent";

export default class GuildCreateEvent extends BaseEvent {
    public static name = "guildCreate";

    public async execute(guild: Guild) {
        await this.app.configManager.getGuildConfig(guild)
        await this.app.commandsManager.registerSlashCommandsFor(guild)
        this.app.logger.success(`Joined guild ${guild.name} (id: ${guild.id})`)
    }
}