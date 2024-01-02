import { Guild } from "discord.js";
import { BaseEvent } from "../baseEvent";

export default class GuildCreateEvent extends BaseEvent {
    public static name = "guildCreate";

    public execute(guild: Guild) {
        this.client.configManager.getGuildConfig(guild)
        this.client.commandsManager.registerSlashCommandsFor(guild)
        this.client.logger.success(`Joined guild ${guild.name}`)
    }
}