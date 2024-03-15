import { MockDiscord } from "@tests/mockDiscord"
import CreateQueueCommand from "./CreateQueueCommand"
import { container } from "tsyringe"
import { Application, ApplicationCommandOptionType, BaseMessageOptions, ChatInputCommandInteraction, Colors, EmbedBuilder } from "discord.js"
import { OptionRequirement } from "@types"
import { createQueue } from "@tests/testutils"

describe("CreateQueueCommand", () => {
    const command = CreateQueueCommand
    const discord = container.resolve(MockDiscord)
    let commandInstance: CreateQueueCommand
    let interaction: ChatInputCommandInteraction

    beforeEach(() => {
        interaction = discord.mockInteraction()
        commandInstance = new command(interaction, discord.getApplication())
        interaction.options.get = jest.fn().mockImplementation((option: string) => {
            switch (option) {
                case "name":
                    return { value: "test name" }
                case "description":
                    return { value: "test description" }
                default:
                    return null
            }
        })
    })

    it("should have the correct name", () => {
        expect(command.name).toBe("create")
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Creates a new queue.")
    })

    it("should have the correct options", () => {
        expect(command.options).toHaveLength(2)
        expect(command.options[0]).toStrictEqual({
            name: "name",
            description: "The name of the queue.",
            type: ApplicationCommandOptionType.String,
            required: true,
        })
        expect(command.options[1]).toStrictEqual({
            name: "description",
            description: "The description of the queue.",
            type: ApplicationCommandOptionType.String,
            required: true
        })
    })

    it("should defer the interaction", async () => {
        const deferSpy = jest.spyOn(interaction, 'deferReply')
        await commandInstance.execute()

        expect(deferSpy).toHaveBeenCalledTimes(1)
    })

    it("should edit the reply with the created queue", async () => {
        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute()

        expect(replySpy).toHaveBeenCalledTimes(1)
        expect(replySpy).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    title: "Queue Created",
                    description: `Queue "${interaction.options.get("name")?.value}" created.`,
                    color: Colors.Green
                }
            }]
        })
    })

    it("should create a queue on the database", async () => {
        let dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)
        await commandInstance.execute()
        dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)

        expect(dbGuild.queues).toHaveLength(1)
        expect(dbGuild.queues[0]).toMatchObject({
            name: "test name",
            description: "test description",
        })
    })

    it("should fail if the queue name is already taken on the same guild", async () => {
        let dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)
        const queue = await createQueue(dbGuild, "test name", "test description")

        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute()

        expect(replySpy).toHaveBeenCalledTimes(1)
        expect(replySpy).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    title: "Queue Creation Failed",
                    description: `Queue with name "${queue.name}" already exists.`,
                    color: Colors.Red
                }
            }]
        })
    })

    it("should create a queue if the queue name is already taken on another guild", async () => {
        const otherGuild = discord.mockGuild()
        let dbGuild = await discord.getApplication().configManager.getGuildConfig(otherGuild)
        await createQueue(dbGuild, "test name", "test description")

        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute()
        dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)

        expect(dbGuild.queues).toHaveLength(1)
        expect(dbGuild.queues[0]).toMatchObject({
            name: "test name",
            description: "test description",
        })

        expect(replySpy).toHaveBeenCalledTimes(1)
        expect(replySpy).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    title: "Queue Created",
                    description: `Queue "${interaction.options.get("name")?.value}" created.`,
                    color: Colors.Green
                }
            }]
        })
    })

    it("should log the queue creation", async () => {
        const logSpy = jest.spyOn(discord.getApplication().logger, 'info')
        await commandInstance.execute()

        expect(logSpy).toHaveBeenCalledWith(expect.stringContaining(`Queue "test name" created on guild "${interaction.guild?.name}" (id: ${interaction.guild?.id})`))
    })
})