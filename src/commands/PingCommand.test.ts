import { BaseMessageOptions, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import PingCommand from "./PingCommand";
import { MockDiscord } from "@tests/mockDiscord";
import { container } from "tsyringe";

describe("PingCommand", () => {
    const command = PingCommand
    const discord = container.resolve(MockDiscord)
    let commandInstance: PingCommand
    let interaction: ChatInputCommandInteraction

    beforeEach(() => {
        interaction = discord.mockInteraction()
        commandInstance = new command(interaction, discord.getApplication())
    })

    it("should have the correct name", () => {
        expect(command.name).toBe("ping")
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Pong! Displays the api & bot latency.")
    })

    it("should have no options", () => {
        expect(command.options).toHaveLength(0)
    })

    it("should first reply with pinging", async () => {
        const replySpy = jest.spyOn(interaction, 'reply')
        await commandInstance.execute()

        expect(replySpy).toHaveBeenCalledWith({ content: "Pinging...", fetchReply: true })
    })

    it("should edit the reply with pong and message embed", async () => {
        const editSpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute()

        expect(editSpy).toHaveBeenCalledTimes(1)
        expect(editSpy).toHaveBeenCalledWith({
            content: "Pong.",
            embeds: [{
                data: {
                    title: "__Response Times__",
                    fields: expect.arrayContaining([
                        expect.objectContaining({
                            name: "Bot Latency:",
                            value: expect.stringContaining(":hourglass_flowing_sand:"),
                        }),
                        expect.objectContaining({
                            name: "API Latency:",
                            value: expect.stringContaining(":hourglass_flowing_sand:"),
                        }),
                    ]),
                    color: interaction.guild?.members.me?.roles.highest.color || 0x7289da
                }
            }]
        })
    })

    it("should have the interaction reply as the result of the edit", async () => {
        const editSpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute()

        const reply = await interaction.fetchReply()
        const spyResult = await editSpy.mock.results[0].value
        expect(reply).toEqual(spyResult)
    })
});