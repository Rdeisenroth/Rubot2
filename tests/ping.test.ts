import { APIEmbedField, BaseMessageOptions, EmbedBuilder } from "discord.js";
import PingCommand from "../src/commands/Ping";
import { MockDiscord } from "./mockDiscord";

describe("PingCommand", () => {
    it("should have the correct name", () => {
        expect(PingCommand.name).toBe("ping")
    })

    it("should have the correct description", () => {
        expect(PingCommand.description).toBe("Pong! Displays the api & bot latency.")
    })

    it("should have no options", () => {
        expect(PingCommand.options).toHaveLength(0)
    })

    it("should first reply with pinging", async () => {
        const command = PingCommand
        const discord = new MockDiscord()
        const interaction = discord.getInteraction()
        const replySpy = jest.spyOn(interaction, 'reply')
        const bot = discord.getClient()
        const commandInstance = new command(interaction, bot)
        await commandInstance.execute()

        expect(replySpy).toHaveBeenCalledWith({ content: "Pinging...", fetchReply: true })

    })

    it("should edit the reply with pong and message embed", async () => {
        const command = PingCommand
        const discord = new MockDiscord()
        const interaction = discord.getInteraction()
        const editSpy = jest.spyOn(interaction, 'editReply')
        const bot = discord.getClient()
        const commandInstance = new command(interaction, bot)
        await commandInstance.execute()
        
        expect(editSpy).toHaveBeenCalledWith({ content: "Pong.", embeds: expect.anything() })
        const messageContent = editSpy.mock.calls[0][0] as BaseMessageOptions
        expect(messageContent.embeds).toBeDefined()
        const embeds = messageContent.embeds as EmbedBuilder[]
        expect(embeds).toHaveLength(1)
        const embed = embeds[0]
        const embedData = embed.data
        expect(embedData.title).toBe("__Response Times__")
        const embedFields = embedData.fields as APIEmbedField[]
        expect(embedFields).toHaveLength(2)
        const botLatencyField = embedFields[0]
        expect(botLatencyField.name).toBe("Bot Latency:")
        expect(botLatencyField.value).toContain(":hourglass_flowing_sand:")
        const apiLatencyField = embedFields[1]
        expect(apiLatencyField.name).toBe("API Latency:")
        expect(apiLatencyField.value).toContain(":hourglass_flowing_sand:")
    })

    it("should have the interaction reply as the result of the edit", async () => {
        const command = PingCommand
        const discord = new MockDiscord()
        const interaction = discord.getInteraction()
        const editSpy = jest.spyOn(interaction, 'editReply')
        const bot = discord.getClient()
        const commandInstance = new command(interaction, bot)
        await commandInstance.execute()

        const reply = await interaction.fetchReply()
        const spyResult = await editSpy.mock.results[0].value
        expect(reply).toEqual(spyResult)
    })
});