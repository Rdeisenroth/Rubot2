import { MockDiscord } from "@tests/mockDiscord"
import SetWaitingRoomCommand from "./SetWaitingRoomCommand"
import { container } from "tsyringe"
import { BaseMessageOptions, ChannelType, ChatInputCommandInteraction, Colors, EmbedBuilder } from "discord.js"
import { createQueue, createRole, createWaitingRoom } from "@tests/testutils"

describe("SetWaitingRoomCommand", () => {
    const command = SetWaitingRoomCommand
    const discord = container.resolve(MockDiscord)
    let commandInstance: SetWaitingRoomCommand
    let interaction: ChatInputCommandInteraction

    beforeEach(() => {
        interaction = discord.mockInteraction()
        commandInstance = new command(interaction, discord.getApplication())
        interaction.options.get = jest.fn().mockImplementation((option: string) => {
            switch (option) {
                case "channel":
                    return { value: "test channel" }
                case "queue":
                    return { value: "test queue" }
                case "supervisor":
                    return { value: `test supervisor ${interaction.guild}` }
                default:
                    return null
            }
        })
        interaction.guild!.channels.cache.get = jest.fn().mockImplementation((key: string) => {
            if (key == "test channel") {
                return {
                    id: "test channel",
                    type: ChannelType.GuildVoice,
                }
            } else {
                return {
                    id: "another channel",
                    type: ChannelType.GuildVoice,
                }
            }
        })
        interaction.guild!.roles.cache.get = jest.fn().mockImplementation((key: string) => {
            if (key == `test supervisor ${interaction.guild}`) {
                return {
                    id: `test supervisor ${interaction.guild}`,
                }
            } else {
                return {
                    id: `another supervisor ${interaction.guild}`,
                }
            }
        })
    })

    it("should have the correct name", () => {
        expect(command.name).toBe("set_waiting_room")
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Sets or overwrites the waiting room for the queue.")
    })

    it("should have the correct options", () => {
        expect(command.options).toHaveLength(3)
        expect(command.options[0]).toStrictEqual({
            name: "channel",
            description: "The voice channel to be set as the waiting room.",
            type: 7,
            required: true,
        })
        expect(command.options[1]).toStrictEqual({
            name: "queue",
            description: "The queue for which the waiting room will be set.",
            type: 3,
            required: true,
        })
        expect(command.options[2]).toStrictEqual({
            name: "supervisor",
            description: "The role that will be able to supervise the waiting room.",
            type: 8,
            required: true,
        })
    })

    it("should defer the interaction", async () => {
        const deferSpy = jest.spyOn(interaction, 'deferReply')
        await commandInstance.execute()

        expect(deferSpy).toHaveBeenCalledTimes(1)
    })

    it("should edit the reply with the created waiting room", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)
        await createQueue(dbGuild, interaction.options.get("queue")!.value as string, "test description")
        await createRole(dbGuild, interaction.options.get("supervisor")!.value as string)
        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute()

        expect(replySpy).toHaveBeenCalledTimes(1)
        expect(replySpy).toHaveBeenCalledWith({ embeds: expect.anything() })
        const messageContent = replySpy.mock.calls[0][0] as BaseMessageOptions
        expect(messageContent.embeds).toBeDefined()
        const embeds = messageContent.embeds as EmbedBuilder[]
        expect(embeds).toHaveLength(1)
        const embed = embeds[0]
        const embedData = embed.data

        expect(embedData).toEqual({
            title: "Waiting Room Set",
            description: expect.stringContaining(`:white_check_mark: Waiting room [object Object] set for queue "${interaction.options.get("queue")?.value}".`),
            color: Colors.Green
        })
    })

    it("should set the waiting room on the database", async () => {
        let dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)
        await createQueue(dbGuild, interaction.options.get("queue")!.value as string, "test description")
        await createRole(dbGuild, interaction.options.get("supervisor")!.value as string)
        await commandInstance.execute()
        dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)

        expect(dbGuild.voice_channels).toHaveLength(1)
        expect(dbGuild.voice_channels[0].id).toBe("test channel")
        expect(dbGuild.voice_channels[0].supervisors).toHaveLength(1)
        expect(dbGuild.voice_channels[0].supervisors![0]).toBe(`test supervisor ${interaction.guild}`)
    })

    it("should overwrite the waiting room on the database if it already exists for the queue", async () => {
        let dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)
        const queue = await createQueue(dbGuild, interaction.options.get("queue")!.value as string, "test description")
        await createRole(dbGuild, interaction.options.get("supervisor")!.value as string)
        await createWaitingRoom(dbGuild, "another channel", queue, `another supervisor ${interaction.guild}`)
        await commandInstance.execute()
        dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)

        expect(dbGuild.voice_channels).toHaveLength(1)
        expect(dbGuild.voice_channels[0].id).toBe("test channel")
        expect(dbGuild.voice_channels[0].supervisors).toHaveLength(1)
        expect(dbGuild.voice_channels[0].supervisors![0]).toBe(`test supervisor ${interaction.guild}`)
    })

    it("should add another waiting room on the database if it is for another queue", async () => {
        let dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)
        // create other waiting room
        const queue = await createQueue(dbGuild, "another channel", "another description")
        await createRole(dbGuild, "another supervisor")
        await createWaitingRoom(dbGuild, "another channel", queue, `another supervisor ${interaction.guild}`)
        // preparations for the command
        await createQueue(dbGuild, interaction.options.get("queue")!.value as string, "test description")
        await createRole(dbGuild, interaction.options.get("supervisor")!.value as string)
        await commandInstance.execute()
        dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)

        expect(dbGuild.voice_channels).toHaveLength(2)
        expect(dbGuild.voice_channels[1].id).toBe("test channel")
        expect(dbGuild.voice_channels[1].supervisors).toHaveLength(1)
        expect(dbGuild.voice_channels[1].supervisors![0]).toBe(`test supervisor ${interaction.guild}`)
    })

    it("should fail if the channel does not exist", async () => {
        let dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)
        await createQueue(dbGuild, interaction.options.get("queue")!.value as string, "test description")
        await createRole(dbGuild, interaction.options.get("supervisor")!.value as string)

        interaction.guild!.channels.cache.get = jest.fn().mockReturnValue(null)
        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute()

        expect(replySpy).toHaveBeenCalledTimes(1)
        expect(replySpy).toHaveBeenCalledWith({ embeds: expect.anything() })

        const messageContent = replySpy.mock.calls[0][0] as BaseMessageOptions
        expect(messageContent.embeds).toBeDefined()
        const embeds = messageContent.embeds as EmbedBuilder[]
        expect(embeds).toHaveLength(1)
        const embed = embeds[0]
        const embedData = embed.data
        expect(embedData).toEqual({
            title: "Could Not Set Waiting Room",
            description: expect.stringContaining(`Could not find channel "test channel" with type "GuildVoice".`),
            color: Colors.Red
        })
    })

    it("should fail if the channel is not a voice channel", async () => {
        let dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)
        await createQueue(dbGuild, interaction.options.get("queue")!.value as string, "test description")
        await createRole(dbGuild, interaction.options.get("supervisor")!.value as string)

        interaction.guild!.channels.cache.get = jest.fn().mockImplementation(() => {
            return {
                id: "test channel",
                type: ChannelType.GuildText,
            }
        })
        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute()

        expect(replySpy).toHaveBeenCalledTimes(1)
        expect(replySpy).toHaveBeenCalledWith({ embeds: expect.anything() })

        const messageContent = replySpy.mock.calls[0][0] as BaseMessageOptions
        expect(messageContent.embeds).toBeDefined()
        const embeds = messageContent.embeds as EmbedBuilder[]
        expect(embeds).toHaveLength(1)
        const embed = embeds[0]
        const embedData = embed.data
        expect(embedData).toEqual({
            title: "Could Not Set Waiting Room",
            description: expect.stringContaining(`:x: Could not find channel "test channel" with type "GuildVoice".`),
            color: Colors.Red
        })
    })

    it("should fail if the queue does not exist", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)
        await createRole(dbGuild, interaction.options.get("supervisor")!.value as string)

        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute()

        expect(replySpy).toHaveBeenCalledTimes(1)
        expect(replySpy).toHaveBeenCalledWith({ embeds: expect.anything() })

        const messageContent = replySpy.mock.calls[0][0] as BaseMessageOptions
        expect(messageContent.embeds).toBeDefined()
        const embeds = messageContent.embeds as EmbedBuilder[]
        expect(embeds).toHaveLength(1)
        const embed = embeds[0]
        const embedData = embed.data
        expect(embedData).toEqual({
            title: "Could Not Set Waiting Room",
            description: expect.stringContaining(`:x: Could not find the queue "test queue".`),
            color: Colors.Red
        })
    })

    it("should fail if the role does not exist", async () => {
        let dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)
        await createQueue(dbGuild, interaction.options.get("queue")!.value as string, "test description")

        interaction.guild!.roles.cache.get = jest.fn().mockReturnValue(null)
        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute()

        expect(replySpy).toHaveBeenCalledTimes(1)
        expect(replySpy).toHaveBeenCalledWith({ embeds: expect.anything() })

        const messageContent = replySpy.mock.calls[0][0] as BaseMessageOptions
        expect(messageContent.embeds).toBeDefined()
        const embeds = messageContent.embeds as EmbedBuilder[]
        expect(embeds).toHaveLength(1)
        const embed = embeds[0]
        const embedData = embed.data
        expect(embedData).toEqual({
            title: "Could Not Set Waiting Room",
            description: expect.stringContaining(`:x: Could not find role "test supervisor ${interaction.guild}".`),
            color: Colors.Red
        })
    })

    it("should fail if the role is not in the database", async () => {
        let dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)
        await createQueue(dbGuild, interaction.options.get("queue")!.value as string, "test description")

        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute()

        expect(replySpy).toHaveBeenCalledTimes(1)
        expect(replySpy).toHaveBeenCalledWith({ embeds: expect.anything() })

        const messageContent = replySpy.mock.calls[0][0] as BaseMessageOptions
        expect(messageContent.embeds).toBeDefined()
        const embeds = messageContent.embeds as EmbedBuilder[]
        expect(embeds).toHaveLength(1)
        const embed = embeds[0]
        const embedData = embed.data
        expect(embedData).toEqual({
            title: "Could Not Set Waiting Room",
            description: expect.stringContaining(`:x: Role [object Object] is not an internal role. Try running \`/admin update_bot_roles\` to update the internal roles.`),
            color: Colors.Red
        })
    })
})