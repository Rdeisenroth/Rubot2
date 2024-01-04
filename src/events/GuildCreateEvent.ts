import { Guild } from "discord.js";
import { BaseEvent } from "@baseEvent";

export default class GuildCreateEvent extends BaseEvent {
    public static name = "guildCreate";

    public async execute(guild: Guild) {
        await this.client.configManager.getGuildConfig(guild)
        await this.client.commandsManager.registerSlashCommandsFor(guild)
        this.client.logger.success(`Joined guild ${guild.name} (id: ${guild.id})`)
    }
}