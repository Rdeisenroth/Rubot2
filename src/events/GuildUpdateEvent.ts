import { BaseEvent } from "@baseEvent";
import { Guild } from "discord.js";

export default class GuildUpdateEvent extends BaseEvent {
    public static name = "guildUpdate";

    public async execute(oldGuild: Guild, newGuild: Guild) {
        if (oldGuild.name !== newGuild.name) {
            this.app.logger.info(`Guild "${oldGuild.name}" (id: ${oldGuild.id}) changed name to "${newGuild.name}"`)
            const dbGuild = await this.app.configManager.getGuildConfig(newGuild)
            dbGuild.name = newGuild.name
            await dbGuild.save()
        } else {
            this.app.logger.info(`Guild "${oldGuild.name}" (id: ${oldGuild.id}) updated with unhandled changes.`)
            this.app.logger.debug(`Old guild: ${JSON.stringify(oldGuild)}\nNew guild: ${JSON.stringify(newGuild)}`)
        }
    }
}