import { MockDiscord } from "@tests/mockDiscord"
import { container } from "tsyringe"
import DmManager from "./DmManager"
import { createQueue } from "@tests/testutils"
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, DMChannel, MessageCreateOptions, MessagePayload, User } from "discord.js"
import { Queue } from "@models/Queue"
import { DocumentType } from "@typegoose/typegoose"

describe("DmManager", () => {
    const discord = container.resolve(MockDiscord)
    let dmManager = container.resolve(DmManager)
    let dmChannel: DMChannel
    let user: User
    let queue: DocumentType<Queue>

    beforeEach(async () => {
        dmChannel = discord.mockDMChannel()
        user = discord.mockUser()
        const guild = discord.mockGuild()
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(guild)
        queue = await createQueue(dbGuild)
    })

    describe("sendQueueJoinMessage", () => {
        it("should send a message to the user", async () => {
            const joinMessage = "You have joined the queue!"

            const dmSpy = jest.spyOn(user, "createDM").mockResolvedValue(dmChannel);
            const sendSpy = jest.spyOn(dmChannel, "send").mockImplementation(() => Promise.resolve({} as any))

            await dmManager.sendQueueJoinMessage(user, queue, joinMessage)

            expect(dmSpy).toHaveBeenCalledTimes(1)
            expect(sendSpy).toHaveBeenCalledTimes(1)
            expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
                embeds: [{
                    data: {
                        title: "Queue Update",
                        description: joinMessage
                    }
                }],
                components: [{
                    data: { type: 1 },
                    components: [{
                        data: { custom_id: "queue_refresh", label: "Refresh", style: ButtonStyle.Primary, type: 2 },
                    },
                    {
                        data: { custom_id: "queue_leave", label: "Leave Queue", style: ButtonStyle.Danger, type: 2 },
                    }
                    ]
                }]
            }));
        })
    })

    describe("sendQueueStayMessage", () => {
        it("should send a message to the user", async () => {
            const dmSpy = jest.spyOn(user, "createDM").mockResolvedValue(dmChannel);
            const sendSpy = jest.spyOn(dmChannel, "send").mockImplementation(() => Promise.resolve({} as any))

            await dmManager.sendQueueStayMessage(user, queue)

            expect(dmSpy).toHaveBeenCalledTimes(1)
            expect(sendSpy).toHaveBeenCalledTimes(1)
            expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
                embeds: [{
                    data: {
                        title: "Queue Update",
                        description: `You stayed in the queue "${queue.name}"`
                    }
                }],
                components: [{
                    data: { type: 1 },
                    components: [{
                        data: { custom_id: "queue_refresh", label: "Refresh", style: ButtonStyle.Primary, type: 2 },
                    },
                    {
                        data: { custom_id: "queue_leave", label: "Leave Queue", style: ButtonStyle.Danger, type: 2 },
                    }
                    ]
                }]
            }));
        })
    })

    describe("sendActuallyLeaveQueueMessage", () => {
        it("should send a message to the user", async () => {
            const leaveMessage = "You have left the queue!"

            const dmSpy = jest.spyOn(user, "createDM").mockResolvedValue(dmChannel);
            const sendSpy = jest.spyOn(dmChannel, "send").mockImplementation(() => Promise.resolve({} as any))

            await dmManager.sendActuallyLeaveQueueMessage(user, queue, leaveMessage)

            expect(dmSpy).toHaveBeenCalledTimes(1)
            expect(sendSpy).toHaveBeenCalledTimes(1)
            expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
                embeds: [{
                    data: {
                        title: "Queue Update",
                        description: leaveMessage
                    }
                }],
                components: [{
                    data: { type: 1 },
                    components: [{
                        data: { custom_id: "queue_stay", label: "Stay in Queue", style: ButtonStyle.Primary, type: 2 },
                    },
                    {
                        data: { custom_id: "queue_leave", label: "Leave Queue", style: ButtonStyle.Danger, type: 2 },
                    }
                    ]
                }]
            }));
        })
    })

    describe("sendQueueLeaveMessage", () => {
        it("should send a message to the user", async () => {
            const leaveMessage = "You have left the queue!"

            const dmSpy = jest.spyOn(user, "createDM").mockResolvedValue(dmChannel);
            const sendSpy = jest.spyOn(dmChannel, "send").mockImplementation(() => Promise.resolve({} as any))

            await dmManager.sendQueueLeaveMessage(user, queue, leaveMessage)

            expect(dmSpy).toHaveBeenCalledTimes(1)
            expect(sendSpy).toHaveBeenCalledTimes(1)
            expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
                embeds: [{
                    data: {
                        title: "Queue Update",
                        description: leaveMessage
                    }
                }],
            }));
        })
    })

    describe("sendQueueLockedMessage", () => {
        it("should send a message to the user", async () => {
            const dmSpy = jest.spyOn(user, "createDM").mockResolvedValue(dmChannel);
            const sendSpy = jest.spyOn(dmChannel, "send").mockImplementation(() => Promise.resolve({} as any))

            await dmManager.sendQueueLockedMessage(user, queue)

            expect(dmSpy).toHaveBeenCalledTimes(1)
            expect(sendSpy).toHaveBeenCalledTimes(1)
            expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
                embeds: [{
                    data: {
                        title: "Queue Update",
                        description: `The queue "${queue.name}" is currently locked. You can't join it at the moment.`
                    }
                }],
            }));
        })
    })

    describe("sendErrorMessage", () => {
        it("should send a description of the error to the user", async () => {
            const error = new Error("My Error")

            const dmSpy = jest.spyOn(user, "createDM").mockResolvedValue(dmChannel);
            const sendSpy = jest.spyOn(dmChannel, "send").mockImplementation(() => Promise.resolve({} as any))

            await dmManager.sendErrorMessage(user, error)

            expect(dmSpy).toHaveBeenCalledTimes(1)
            expect(sendSpy).toHaveBeenCalledTimes(1)
            expect(sendSpy).toHaveBeenCalledWith(expect.objectContaining({
                embeds: [{
                    data: {
                        title: "Error",
                        description: `An error occurred: ${error.message}`
                    }
                }],
            }));
        })
    })

})
