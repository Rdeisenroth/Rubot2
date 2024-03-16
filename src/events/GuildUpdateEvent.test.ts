import { container } from "tsyringe"
import GuildUpdateEvent from "./GuildUpdateEvent"
import { MockDiscord } from "@tests/mockDiscord"
import { Guild } from "discord.js"
import { GuildModel } from "@models/Models"

describe("GuildUpdateEvent", () => {
    const event = GuildUpdateEvent
    const discord = container.resolve(MockDiscord)
    let eventInstance: GuildUpdateEvent
    let oldGuild: Guild

    beforeEach(() => {
        eventInstance = new event(discord.getApplication())
        oldGuild = discord.mockGuild()
    })

    it("should have the correct name", () => {
        expect(event.name).toBe("guildUpdate")
    })

    it ("should log the guild name and id if the name changed", async () => {
        await discord.getApplication().configManager.getGuildConfig(oldGuild)
        const logSpy = jest.spyOn(discord.getApplication().logger, 'info')
        const newGuild = { ...oldGuild } as Guild
        newGuild.name = "new name"
        await eventInstance.execute(oldGuild, newGuild)

        expect(logSpy).toHaveBeenCalledTimes(1)
        expect(logSpy).toHaveBeenCalledWith(`Guild "${oldGuild.name}" (id: ${oldGuild.id}) changed name to "${newGuild.name}"`)
    })

    it ("should update the guild name in the database if the name changed", async () => {
        let dbGuild = await discord.getApplication().configManager.getGuildConfig(oldGuild)
        const saveSpy = jest.spyOn(GuildModel.prototype as any, 'save')
        const newGuild = { ...oldGuild } as Guild
        newGuild.name = "new name"
        await eventInstance.execute(oldGuild, newGuild)

        expect(saveSpy).toHaveBeenCalledTimes(1)
        
        dbGuild = await discord.getApplication().configManager.getGuildConfig(oldGuild)
        expect(dbGuild.name).toBe(newGuild.name)
    })
})