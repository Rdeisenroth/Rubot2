import { container } from "tsyringe"
import GuildCreateEvent from "./GuildCreateEvent"
import { MockDiscord } from "@tests/mockDiscord"
import { Guild } from "discord.js"
import { CommandsManager } from "@managers"
import { GuildModel } from "@models/Guild"

describe("GuildCreateEvent", () => {
    const event = GuildCreateEvent
    const discord = container.resolve(MockDiscord)
    let eventInstance: GuildCreateEvent
    let guild: Guild

    beforeEach(() => {
        eventInstance = new event(discord.getApplication())
        guild = discord.mockGuild()
        guild.commands.set = jest.fn().mockImplementation(() => Promise.resolve())
    })

    it("should have the correct name", () => {
        expect(event.name).toBe("guildCreate")
    })

    it("should log the guild name and id", async () => {
        const logSpy = jest.spyOn(discord.getApplication().logger, 'success')
        await eventInstance.execute(guild)

        expect(logSpy).toHaveBeenCalledTimes(1)
        expect(logSpy).toHaveBeenCalledWith(`Joined guild "${guild.name}" (id: ${guild.id})`)
    })

    it("should create a new guild in the database", async () => {
        const findSpy = jest.spyOn(GuildModel, 'findById')
        const saveSpy = jest.spyOn(GuildModel.prototype, 'save')
        await eventInstance.execute(guild)

        expect(findSpy).toHaveBeenCalledTimes(1)
        expect(findSpy).toHaveBeenCalledWith(guild.id)

        expect(saveSpy).toHaveBeenCalledTimes(1)
        const saveSpyRes = await saveSpy.mock.results[0].value
        expect(saveSpyRes).toMatchObject({ _id: guild.id })
    })

    it("should register slash commands for the guild", async () => {
        const commandsManager = container.resolve(CommandsManager)
        const registerSpy = jest.spyOn(commandsManager, 'registerSlashCommandsFor')
        await eventInstance.execute(guild)

        expect(registerSpy).toHaveBeenCalledTimes(1)
        expect(registerSpy).toHaveBeenCalledWith(guild)
    })
})