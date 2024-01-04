import { container } from "tsyringe"
import ReadyEvent from "./ReadyEvent"
import { MockDiscord } from "@tests/mockDiscord"
import { ActivityType, Guild } from "discord.js"
import { GuildModel } from "@models/Guild"


describe("ReadyEvent", () => {
    const event = ReadyEvent
    const discord = container.resolve(MockDiscord)
    let eventInstance: ReadyEvent
    let guild: Guild

    beforeEach(() => {
        eventInstance = new event(discord.getClient())
        guild = discord.mockGuild()
        guild.commands.set = jest.fn().mockImplementation(() => Promise.resolve())
    })

    it("should have the correct name", () => {
        expect(event.name).toBe("ready")
    })

    it("should log the bot stats", async () => {
        const logSpy = jest.spyOn(discord.getClient().logger, 'ready')
        await eventInstance.execute()

        expect(logSpy).toHaveBeenCalledTimes(1)
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(`"${discord.getClient().user?.username}" is Ready!`))
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(`Bot Stats:`))
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(`${discord.getClient().users.cache.size} user(s)`))
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(`${discord.getClient().channels.cache.size} channel(s)`))
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(`${discord.getClient().guilds.cache.size} guild(s)`))
    })

    it("should not create a new guild entry in the database if it already exists", async () => {
        await discord.getClient().configManager.getGuildConfig(guild)

        const findSpy = jest.spyOn(GuildModel, 'findById')
        const saveSpy = jest.spyOn(GuildModel.prototype, 'save')
        await eventInstance.execute()

        expect(findSpy).toHaveBeenCalledWith(guild.id)

        expect(saveSpy).toHaveBeenCalledTimes(0)
    })

    it("should create a new guild entry in the database if it does not exist", async () => {
        const findSpy = jest.spyOn(GuildModel, 'findById')
        const saveSpy = jest.spyOn(GuildModel.prototype, 'save')
        await eventInstance.execute()

        expect(findSpy).toHaveBeenCalledWith(guild.id)

        expect(saveSpy).toHaveBeenCalledTimes(1)
        const saveSpyRes = await saveSpy.mock.results[0].value
        expect(saveSpyRes).toMatchObject({ _id: guild.id })
    })


    it("should register slash commands for the guild", async () => {
        const registerSpy = jest.spyOn(discord.getClient().commandsManager, 'registerSlashCommandsFor')
        const commandSetSpy = jest.spyOn(guild.commands, 'set')
        await eventInstance.execute()

        expect(registerSpy).toHaveBeenCalledWith(guild)
        expect(commandSetSpy).toHaveBeenCalled()
    })

    it("should set the bot's presence", async () => {
        const setPresenceSpy = jest.spyOn(discord.getClient().user!, 'setPresence')
        await eventInstance.execute()

        expect(setPresenceSpy).toHaveBeenCalledTimes(1)
        expect(setPresenceSpy).toHaveBeenCalledWith(expect.objectContaining({
            status: 'online',
            activities: [{ name: 'Sprechstunden', type: ActivityType.Watching }],
            afk: false
        }))
    })
})