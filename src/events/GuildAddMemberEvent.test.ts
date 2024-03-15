import { MockDiscord } from "@tests/mockDiscord"
import GuildAddMemberEvent from "./GuildAddMemberEvent"
import { container } from "tsyringe"
import { BaseMessageOptions, Guild as DiscordGuild, EmbedBuilder, GuildMember } from "discord.js"
import { Guild as DatabaseGuild } from "@models/Guild"
import { UserModel } from "@models/User"
import { DocumentType } from "@typegoose/typegoose"

describe("GuildAddMemberEvent", () => {
    const event = GuildAddMemberEvent
    const discord = container.resolve(MockDiscord)
    let eventInstance: GuildAddMemberEvent
    let discordGuild: DiscordGuild
    let databaseGuild: DocumentType<DatabaseGuild>
    let member: GuildMember

    beforeEach(async () => {
        eventInstance = new event(discord.getApplication())
        discordGuild = discord.mockGuild()
        member = discord.mockGuildMember(discord.mockUser(), discordGuild)
        databaseGuild = await discord.getApplication().configManager.getDefaultGuildConfig(discordGuild)
    })

    it("should have the correct name", () => {
        expect(event.name).toBe("guildMemberAdd")
    })

    it("should log the guild name and id and new member name and id", async () => {
        const logSpy = jest.spyOn(discord.getApplication().logger, 'info')
        await eventInstance.execute(member)

        expect(logSpy).toHaveBeenCalledWith(`Member ${member.user.tag} (id: ${member.id}) joined guild "${member.guild.name}" (id: ${member.guild.id})`)
    })

    it("should create a new user in the database if it doesn't exist", async () => {
        const saveSpy = jest.spyOn(UserModel.prototype as any, 'save')
        await eventInstance.execute(member)

        expect(saveSpy).toHaveBeenCalledTimes(1)
        const saveSpyRes = await saveSpy.mock.results[0].value
        expect(saveSpyRes).toMatchObject({ _id: member.id })
    })

    it("should not create a new user in the database if it already exists", async () => {
        await discord.getApplication().userManager.getUser(member.user)
        jest.clearAllMocks() // seems to be necessary here because the saveSpy is still set from the previous test
        const saveSpy = jest.spyOn(UserModel.prototype as any, 'save')
        
        await eventInstance.execute(member)

        expect(saveSpy).toHaveBeenCalledTimes(0)
    })

    it("should send a welcome message to the new member, when it is set for the guild", async () => {
        member.send = jest.fn()
        databaseGuild.welcome_text = "Welcome to ${guild_name}, ${member}!"
        databaseGuild.welcome_title = "Welcome to ${guild_name}!"
        await databaseGuild.save()

        const sendSpy = jest.spyOn(member, 'send')
        await eventInstance.execute(member)

        expect(sendSpy).toHaveBeenCalledTimes(1)
        expect(sendSpy).toHaveBeenCalledWith({ embeds: expect.anything() })
        const messageContent = sendSpy.mock.calls[0][0] as BaseMessageOptions
        expect(messageContent.embeds).toBeDefined()
        const embeds = messageContent.embeds as EmbedBuilder[]
        expect(embeds).toHaveLength(1)
        const embed = embeds[0]
        const embedData = embed.data
        expect(embedData.title).toBe(`Welcome to ${discordGuild.name}!`)
        expect(embedData.description).toBe(`Welcome to ${discordGuild.name}, ${member}!`)
    })

    it("should not send a welcome message to the new member, when it is not set for the guild", async () => {
        databaseGuild.welcome_text = undefined
        await databaseGuild.save()

        member.send = jest.fn()
        await eventInstance.execute(member)

        expect(member.send).toHaveBeenCalledTimes(0)
    })
})