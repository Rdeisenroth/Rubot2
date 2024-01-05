import { container } from "tsyringe"
import InteractionCreateEvent from "./InteractionCreateEvent"
import { MockDiscord } from "@tests/mockDiscord"
import { ChatInputCommandInteraction, Interaction } from "discord.js"
import PingCommand from "@commands/PingCommand"


describe("InteractionCreateEvent", () => {
    const event = InteractionCreateEvent
    const discord = container.resolve(MockDiscord)
    let eventInstance: InteractionCreateEvent
    let interaction: Interaction

    beforeEach(() => {
        eventInstance = new event(discord.getApplication())
        interaction = discord.mockInteraction("ping")
    })

    it("should have the correct name", () => {
        expect(event.name).toBe("interactionCreate")
    })

    it("should log who executed which command with which options in which guild", async () => {
        const logSpy = jest.spyOn(discord.getApplication().logger, 'info')
        await eventInstance.execute(interaction)

        const commandInteraction = interaction as ChatInputCommandInteraction
        expect(logSpy).toHaveBeenCalledTimes(1)
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(`${interaction.user.tag} executed command "${commandInteraction.commandName}" with options`))
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(`in guild ${interaction.guild?.name} (id: ${interaction.guild?.id})`))
    })

    it("should not execute a command if the interaction is not a command", async () => {
        const executeSpy = jest.spyOn(PingCommand.prototype, 'execute')
        interaction.isCommand = jest.fn().mockReturnValue(false)
        await eventInstance.execute(interaction)

        expect(executeSpy).toHaveBeenCalledTimes(0)
    })

    it("should execute if the interaction is a command", async () => {
        const executeSpy = jest.spyOn(PingCommand.prototype, 'execute')
        await eventInstance.execute(interaction)

        expect(executeSpy).toHaveBeenCalledTimes(1)
    })
})