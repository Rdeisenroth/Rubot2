import { container } from "tsyringe"
import InteractionCreateEvent from "../../src/events/InteractionCreateEvent"
import { MockDiscord } from "../mockDiscord"
import { ChatInputCommandInteraction, Interaction } from "discord.js"
import PingCommand from "../../src/commands/PingCommand"


describe("InteractionCreateEvent", () => {
    const event = InteractionCreateEvent
    const discord = container.resolve(MockDiscord)
    let eventInstance: InteractionCreateEvent
    let interaction: Interaction

    beforeEach(() => {
        eventInstance = new event(discord.getClient())
        interaction = discord.mockInteraction("ping")
    })

    it("should have the correct name", () => {
        expect(event.name).toBe("interactionCreate")
    })

    it("should log who executed which command with which options", async () => {
        const logSpy = jest.spyOn(discord.getClient().logger, 'info')
        await eventInstance.execute(interaction)

        const commandInteraction = interaction as ChatInputCommandInteraction
        expect(logSpy).toHaveBeenCalledTimes(2)
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(`${interaction.user.tag} executed command "${commandInteraction.commandName}" with options`))
        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(`Command ${commandInteraction.commandName} executed successfully.`))
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