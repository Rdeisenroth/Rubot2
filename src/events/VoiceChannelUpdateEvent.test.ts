import { MockDiscord } from "@tests/mockDiscord"
import { Collection, Guild, GuildChannel, VoiceChannel, VoiceState } from "discord.js"
import { container } from "tsyringe"
import VoiceChannelUpdateEvent from "./VoiceChannelUpdateEvent"
import { createQueue, createRole, createRoom, createVoiceChannel } from "@tests/testutils"
import { QueueEventType } from "@models/Event"
import { GuildModel, RoomModel } from "@models/Models"
import { randomInt } from "crypto"

describe("VoiceChannelUpdateEvent", () => {
    const event = VoiceChannelUpdateEvent
    const discord = container.resolve(MockDiscord)
    let eventInstance: VoiceChannelUpdateEvent
    let guild: Guild

    beforeEach(() => {
        eventInstance = new event(discord.getApplication())
        guild = discord.mockGuild()

    })

    it("should have the correct name", () => {
        expect(event.name).toBe("voiceStateUpdate")
    })

    it("should not react if the channel stays the same", async () => {
        const oldState = discord.mockVoiceState(guild, { channelID: "123" })
        const newState = discord.mockVoiceState(guild, { channelID: "123" })

        const joinSpy = jest.spyOn(eventInstance as any, "handleVoiceJoin")
        const leaveSpy = jest.spyOn(eventInstance as any, "handleVoiceLeave")

        await eventInstance.execute(oldState, newState)

        expect(joinSpy).toHaveBeenCalledTimes(0)
        expect(leaveSpy).toHaveBeenCalledTimes(0)
    })

    describe.each([null, randomInt(281474976710655).toString()])("when a user joins a voice channel from channel: %p", (oldChannelId) => {
        it("should not do anything when it a normal voice channel", async () => {
            const member = discord.mockGuildMember(discord.mockUser(), guild)
            const channelID = randomInt(281474976710655).toString()
            const oldState = discord.mockVoiceState(guild, { channelID: oldChannelId, member: member })
            const newState = discord.mockVoiceState(guild, { channelID: channelID, member: member })

            jest.clearAllMocks()
            const joinSpy = jest.spyOn(eventInstance as any, "handleVoiceJoin")
            const joinQueueSpy = jest.spyOn(eventInstance as any, "handleQueueJoin")
            const joinRoomSpy = jest.spyOn(eventInstance as any, "handleRoomEvent")
            const leaveSpy = jest.spyOn(eventInstance as any, "handleVoiceLeave")

            await eventInstance.execute(oldState, newState)

            expect(joinSpy).toHaveBeenCalledTimes(1)
            expect(joinQueueSpy).toHaveBeenCalledTimes(0)
            expect(joinRoomSpy).toHaveBeenCalledTimes(0)
            expect(leaveSpy).toHaveBeenCalledTimes(oldChannelId ? 1 : 0)
        })

        it("should add the user to the queue when the voice channel has a queue", async () => {
            const member = discord.mockGuildMember(discord.mockUser(), guild)
            const channelID = randomInt(281474976710655).toString()
            const oldState = discord.mockVoiceState(guild, { channelID: oldChannelId, member: member })
            const newState = discord.mockVoiceState(guild, { channelID: channelID, member: member })

            const dbGuild = await discord.getApplication().configManager.getGuildConfig(guild)
            const queue = await createQueue(dbGuild, { info_channels: [{ channel_id: channelID, events: Object.values(QueueEventType) }] })
            await createVoiceChannel(dbGuild, { queue: queue, channelID: channelID, supervisor: "tutor"})

            jest.clearAllMocks()
            const joinSpy = jest.spyOn(eventInstance as any, "handleVoiceJoin")
            const joinQueueSpy = jest.spyOn(eventInstance as any, "handleQueueJoin")
            const joinRoomSpy = jest.spyOn(eventInstance as any, "handleRoomEvent")
            const leaveSpy = jest.spyOn(eventInstance as any, "handleVoiceLeave")
            const saveSpy = jest.spyOn(GuildModel.prototype as any, 'save');
            const sendQueueJoinMessageSpy = jest.spyOn(discord.getApplication().dmManager, "sendQueueJoinMessage").mockResolvedValue()

            await eventInstance.execute(oldState, newState)

            expect(joinSpy).toHaveBeenCalledTimes(1)
            expect(joinQueueSpy).toHaveBeenCalledTimes(1)
            expect(joinRoomSpy).toHaveBeenCalledTimes(0)
            expect(leaveSpy).toHaveBeenCalledTimes(oldChannelId ? 1 : 0)
            expect(saveSpy).toHaveBeenCalledTimes(1);
            const saveSpyRes = await saveSpy.mock.results[0].value;
            expect(saveSpyRes.queues[0].entries).toHaveLength(1);
            expect(saveSpyRes.queues[0].entries[0].discord_id).toBe(member.user.id);
            expect(sendQueueJoinMessageSpy).toHaveBeenCalledTimes(1);
        })

        it("should not add the user to the queue when the user is a tutor", async () => {
            const dbGuild = await discord.getApplication().configManager.getGuildConfig(guild)
            const tutorRole = await createRole(dbGuild, `tutor ${guild.id}`)
            const discordTutorRole = discord.mockRole(guild!, { id: tutorRole.server_role_name, name: `tutor ${guild}` })

            const member = discord.mockGuildMember(discord.mockUser(), guild, [discordTutorRole.id])

            const channelID = randomInt(281474976710655).toString()
            const queue = await createQueue(dbGuild, { info_channels: [{ channel_id: channelID, events: Object.values(QueueEventType) }] })
            await createVoiceChannel(dbGuild, { queue: queue, channelID: channelID, supervisor: "tutor"})

            const oldState = discord.mockVoiceState(guild, { channelID: oldChannelId, member: member })
            const newState = discord.mockVoiceState(guild, { channelID: channelID, member: member })

            discord.getApplication().dmManager.sendQueueJoinMessage = jest.fn()

            jest.clearAllMocks();
            const joinSpy = jest.spyOn(eventInstance as any, "handleVoiceJoin")
            const joinQueueSpy = jest.spyOn(eventInstance as any, "handleQueueJoin")
            const joinRoomSpy = jest.spyOn(eventInstance as any, "handleRoomEvent")
            const leaveSpy = jest.spyOn(eventInstance as any, "handleVoiceLeave")
            const saveSpy = jest.spyOn(GuildModel.prototype as any, 'save');

            await eventInstance.execute(oldState, newState)

            expect(joinSpy).toHaveBeenCalledTimes(1)
            expect(joinQueueSpy).toHaveBeenCalledTimes(1)
            expect(joinRoomSpy).toHaveBeenCalledTimes(0)
            expect(leaveSpy).toHaveBeenCalledTimes(oldChannelId ? 1 : 0)
            expect(saveSpy).toHaveBeenCalledTimes(0);
        })

        it("should keep the user in the queue if he is in the pending queue stays for the same guild", async () => {
            const member = discord.mockGuildMember(discord.mockUser(), guild)

            const channelID = randomInt(281474976710655).toString()
            const dbGuild = await discord.getApplication().configManager.getGuildConfig(guild)
            const queue = await createQueue(dbGuild, {
                info_channels: [{ channel_id: channelID, events: Object.values(QueueEventType) }],
                entries: [{ discord_id: member.id, joinedAt: Date.now().toString() }]
            })
            await createVoiceChannel(dbGuild, { queue: queue, channelID: channelID, supervisor: "tutor"})

            const queueManager = discord.getApplication().queueManager
            Object.defineProperty(queueManager, "pendingQueueStays", { value: new Collection([[queue.id, [member.id]]]) })

            const oldState = discord.mockVoiceState(guild, { channelID: oldChannelId, member: member })
            const newState = discord.mockVoiceState(guild, { channelID: channelID, member: member })

            jest.clearAllMocks()
            const joinSpy = jest.spyOn(eventInstance as any, "handleVoiceJoin")
            const joinQueueSpy = jest.spyOn(eventInstance as any, "handleQueueJoin")
            const joinRoomSpy = jest.spyOn(eventInstance as any, "handleRoomEvent")
            const leaveSpy = jest.spyOn(eventInstance as any, "handleVoiceLeave")
            const saveSpy = jest.spyOn(GuildModel.prototype as any, 'save');
            const sendQueueStayMessageSpy = jest.spyOn(discord.getApplication().dmManager, "sendQueueStayMessage").mockResolvedValue()

            await eventInstance.execute(oldState, newState)

            expect(joinSpy).toHaveBeenCalledTimes(1)
            expect(joinQueueSpy).toHaveBeenCalledTimes(1)
            expect(joinRoomSpy).toHaveBeenCalledTimes(0)
            expect(leaveSpy).toHaveBeenCalledTimes(oldChannelId ? 1 : 0)
            expect(saveSpy).toHaveBeenCalledTimes(0);
            expect(sendQueueStayMessageSpy).toHaveBeenCalledTimes(1);
            const pendingQueueStays = (queueManager as any).pendingQueueStays
            expect(pendingQueueStays).toMatchObject(new Collection([[queue.id, []]]))
        })

        it("should send the queue locked message if the queue is locked", async () => {
            const member = discord.mockGuildMember(discord.mockUser(), guild)

            const channelID = randomInt(281474976710655).toString()
            const dbGuild = await discord.getApplication().configManager.getGuildConfig(guild)
            const queue = await createQueue(dbGuild, {
                info_channels: [{ channel_id: channelID, events: Object.values(QueueEventType) }],
                locked: true
            })
            await createVoiceChannel(dbGuild, { queue: queue, channelID: channelID, supervisor: "tutor"})

            const oldState = discord.mockVoiceState(guild, { channelID: oldChannelId, member: member })
            const newState = discord.mockVoiceState(guild, { channelID: channelID, member: member })

            jest.clearAllMocks()
            const joinSpy = jest.spyOn(eventInstance as any, "handleVoiceJoin")
            const joinQueueSpy = jest.spyOn(eventInstance as any, "handleQueueJoin")
            const joinRoomSpy = jest.spyOn(eventInstance as any, "handleRoomEvent")
            const leaveSpy = jest.spyOn(eventInstance as any, "handleVoiceLeave")
            const saveSpy = jest.spyOn(GuildModel.prototype as any, 'save');
            const sendQueueLockedMessageSpy = jest.spyOn(discord.getApplication().dmManager, "sendQueueLockedMessage").mockResolvedValue()
            const setChannelSpy = jest.spyOn(VoiceState.prototype, "setChannel").mockImplementation()

            await eventInstance.execute(oldState, newState)

            expect(joinSpy).toHaveBeenCalledTimes(1)
            expect(joinQueueSpy).toHaveBeenCalledTimes(1)
            expect(joinRoomSpy).toHaveBeenCalledTimes(0)
            expect(leaveSpy).toHaveBeenCalledTimes(oldChannelId ? 1 : 0)
            expect(saveSpy).toHaveBeenCalledTimes(0);
            expect(sendQueueLockedMessageSpy).toHaveBeenCalledTimes(1);
            expect(setChannelSpy).toHaveBeenCalledTimes(1);

        })

        it("should add the event to the room if the voice channel is a room model", async () => {
            const member = discord.mockGuildMember(discord.mockUser(), guild)

            const channelID = randomInt(281474976710655).toString()
            const dbGuild = await discord.getApplication().configManager.getGuildConfig(guild)
            const dbRoom = await createRoom(dbGuild, { roomId: channelID })

            const oldState = discord.mockVoiceState(guild, { channelID: oldChannelId, member: member })
            const newState = discord.mockVoiceState(guild, { channelID: channelID, member: member })

            jest.clearAllMocks()
            const joinSpy = jest.spyOn(eventInstance as any, "handleVoiceJoin")
            const joinQueueSpy = jest.spyOn(eventInstance as any, "handleQueueJoin")
            const joinRoomSpy = jest.spyOn(eventInstance as any, "handleRoomEvent")
            const leaveSpy = jest.spyOn(eventInstance as any, "handleVoiceLeave")
            const saveGuildSpy = jest.spyOn(GuildModel.prototype as any, 'save');
            const saveRoomSpy = jest.spyOn(RoomModel.prototype as any, 'save');

            await eventInstance.execute(oldState, newState)

            expect(joinSpy).toHaveBeenCalledTimes(1)
            expect(joinQueueSpy).toHaveBeenCalledTimes(0)
            expect(joinRoomSpy).toHaveBeenCalledTimes(1)
            expect(leaveSpy).toHaveBeenCalledTimes(oldChannelId ? 1 : 0)
            expect(saveGuildSpy).toHaveBeenCalledTimes(0);
            expect(saveRoomSpy).toHaveBeenCalledTimes(1);
            const saveRoomSpyRes = await saveRoomSpy.mock.results[0].value;
            expect(saveRoomSpyRes.events).toHaveLength(1);
            expect(saveRoomSpyRes.events[0].type).toBe("user_join");
        })
    })

    describe.each([null, randomInt(281474976710655).toString()])("when a user leaves a voice channel to %p", (newChannelId) => {

        it("should not do anything when it a normal voice channel", async () => {
            const member = discord.mockGuildMember(discord.mockUser(), guild)
            const channelID = randomInt(281474976710655).toString()
            const oldState = discord.mockVoiceState(guild, { channelID: channelID, member: member })
            const newState = discord.mockVoiceState(guild, { channelID: newChannelId, member: member })

            jest.clearAllMocks()
            const joinSpy = jest.spyOn(eventInstance as any, "handleVoiceJoin")
            const joinQueueSpy = jest.spyOn(eventInstance as any, "handleQueueJoin")
            const joinRoomSpy = jest.spyOn(eventInstance as any, "handleRoomEvent")
            const leaveSpy = jest.spyOn(eventInstance as any, "handleVoiceLeave")

            await eventInstance.execute(oldState, newState)

            expect(joinSpy).toHaveBeenCalledTimes(newChannelId ? 1 : 0)
            expect(leaveSpy).toHaveBeenCalledTimes(1)
        })

        it("should remove the user from the queue when the voice channel has a queue and no timeout", async () => {
            const member = discord.mockGuildMember(discord.mockUser(), guild)
            const channelID = randomInt(281474976710655).toString()
            const oldState = discord.mockVoiceState(guild, { channelID: channelID, member: member })
            const newState = discord.mockVoiceState(guild, { channelID: newChannelId, member: member })

            const dbGuild = await discord.getApplication().configManager.getGuildConfig(guild)
            const queue = await createQueue(dbGuild, {
                info_channels: [{ channel_id: channelID, events: Object.values(QueueEventType) }],
                entries: [{ discord_id: member.id, joinedAt: Date.now().toString() }],
                disconnect_timeout: 0
            })
            await createVoiceChannel(dbGuild, { queue: queue, channelID: channelID, supervisor: "tutor"})

            // call restore to restore the original implementation of the function which was changed in another test
            jest.restoreAllMocks()
            const joinSpy = jest.spyOn(eventInstance as any, "handleVoiceJoin")
            const leaveSpy = jest.spyOn(eventInstance as any, "handleVoiceLeave")
            const saveSpy = jest.spyOn(GuildModel.prototype as any, 'save');
            const sendQueueLeaveMessage = jest.spyOn(discord.getApplication().dmManager, "sendQueueLeaveMessage").mockResolvedValue()

            await eventInstance.execute(oldState, newState)

            expect(joinSpy).toHaveBeenCalledTimes(newChannelId ? 1 : 0)
            expect(leaveSpy).toHaveBeenCalledTimes(1)
            expect(saveSpy).toHaveBeenCalledTimes(1);
            const saveSpyRes = await saveSpy.mock.results[0].value;
            expect(saveSpyRes.queues[0].entries).toHaveLength(0);
            expect(sendQueueLeaveMessage).toHaveBeenCalledTimes(1);
        })

        it("should not directly remove the user from the queue not send a actually want to leave message when the voice channel has a queue and a timeout", async () => {
            const member = discord.mockGuildMember(discord.mockUser(), guild)
            const channelID = randomInt(281474976710655).toString()
            const oldState = discord.mockVoiceState(guild, { channelID: channelID, member: member })
            const newState = discord.mockVoiceState(guild, { channelID: newChannelId, member: member })

            const dbGuild = await discord.getApplication().configManager.getGuildConfig(guild)
            const queue = await createQueue(dbGuild, {
                info_channels: [{ channel_id: channelID, events: Object.values(QueueEventType) }],
                entries: [{ discord_id: member.id, joinedAt: Date.now().toString() }],
                disconnect_timeout: 1
            })
            await createVoiceChannel(dbGuild, { queue: queue, channelID: channelID, supervisor: "tutor"})

            // mock leave queue because otherwise we get mongo connection errors
            jest.clearAllMocks()
            const joinSpy = jest.spyOn(eventInstance as any, "handleVoiceJoin")
            const leaveSpy = jest.spyOn(eventInstance as any, "handleVoiceLeave")
            const sendQueueLeaveMessage = jest.spyOn(discord.getApplication().dmManager, "sendActuallyLeaveQueueMessage").mockResolvedValue()
            const leaveQueueSpy = jest.spyOn(discord.getApplication().queueManager, "leaveQueue").mockResolvedValue("leave message")

            await eventInstance.execute(oldState, newState)
            // wait so leave queue can be called
            await new Promise(resolve => setTimeout(resolve, 1))

            expect(joinSpy).toHaveBeenCalledTimes(newChannelId ? 1 : 0)
            expect(leaveSpy).toHaveBeenCalledTimes(1)
            expect(leaveQueueSpy).toHaveBeenCalledTimes(1);
            expect(sendQueueLeaveMessage).toHaveBeenCalledTimes(1);
        })

        it("should remove the room when the voice channel is temporary and empty", async () => {
            const member = discord.mockGuildMember(discord.mockUser(), guild)
            const channelID = randomInt(281474976710655).toString()
            const oldState = discord.mockVoiceState(guild, { channelID: channelID, member: member, numberOfMembersOfChannel: 0})
            const newState = discord.mockVoiceState(guild, { channelID: newChannelId, member: member })

            const dbGuild = await discord.getApplication().configManager.getGuildConfig(guild)
            await createVoiceChannel(dbGuild, { channelID: channelID, temporary: true })

            jest.clearAllMocks()
            const joinSpy = jest.spyOn(eventInstance as any, "handleVoiceJoin")
            const leaveSpy = jest.spyOn(eventInstance as any, "handleVoiceLeave")
            const saveSpy = jest.spyOn(GuildModel.prototype as any, 'save');
            const deleteSpy = jest.spyOn(oldState.channel!, "delete")

            await eventInstance.execute(oldState, newState)

            expect(joinSpy).toHaveBeenCalledTimes(newChannelId ? 1 : 0)
            expect(leaveSpy).toHaveBeenCalledTimes(1)
            expect(saveSpy).toHaveBeenCalledTimes(0);
            expect(deleteSpy).toHaveBeenCalledTimes(1);
        })

        it("should not remove the room when the voice channel is temporary but not empty", async () => {
            const member = discord.mockGuildMember(discord.mockUser(), guild)
            const channelID = randomInt(281474976710655).toString()
            const oldState = discord.mockVoiceState(guild, { channelID: channelID, member: member, numberOfMembersOfChannel: 2})
            const newState = discord.mockVoiceState(guild, { channelID: newChannelId, member: member })

            const dbGuild = await discord.getApplication().configManager.getGuildConfig(guild)
            await createVoiceChannel(dbGuild, { channelID: channelID, temporary: true })

            jest.clearAllMocks()
            const joinSpy = jest.spyOn(eventInstance as any, "handleVoiceJoin")
            const leaveSpy = jest.spyOn(eventInstance as any, "handleVoiceLeave")
            const saveSpy = jest.spyOn(GuildModel.prototype as any, 'save');
            const deleteSpy = jest.spyOn(oldState.channel!, "delete")

            await eventInstance.execute(oldState, newState)

            expect(joinSpy).toHaveBeenCalledTimes(newChannelId ? 1 : 0)
            expect(leaveSpy).toHaveBeenCalledTimes(1)
            expect(saveSpy).toHaveBeenCalledTimes(0);
            expect(deleteSpy).toHaveBeenCalledTimes(0);
        })

        it("should not remove the room when the voice channel is not temporary", async () => {
            const member = discord.mockGuildMember(discord.mockUser(), guild)
            const channelID = randomInt(281474976710655).toString()
            const oldState = discord.mockVoiceState(guild, { channelID: channelID, member: member, numberOfMembersOfChannel: 0})
            const newState = discord.mockVoiceState(guild, { channelID: newChannelId, member: member })

            const dbGuild = await discord.getApplication().configManager.getGuildConfig(guild)
            await createVoiceChannel(dbGuild, { channelID: channelID, temporary: false })

            jest.clearAllMocks()
            const joinSpy = jest.spyOn(eventInstance as any, "handleVoiceJoin")
            const leaveSpy = jest.spyOn(eventInstance as any, "handleVoiceLeave")
            const saveSpy = jest.spyOn(GuildModel.prototype as any, 'save');
            const deleteSpy = jest.spyOn(oldState.channel!, "delete")

            await eventInstance.execute(oldState, newState)

            expect(joinSpy).toHaveBeenCalledTimes(newChannelId ? 1 : 0)
            expect(leaveSpy).toHaveBeenCalledTimes(1)
            expect(saveSpy).toHaveBeenCalledTimes(0);
            expect(deleteSpy).toHaveBeenCalledTimes(0);
        })

        it("should add the event to the room if the voice channel is a room model", async () => {
            const member = discord.mockGuildMember(discord.mockUser(), guild)

            const channelID = randomInt(281474976710655).toString()
            const dbGuild = await discord.getApplication().configManager.getGuildConfig(guild)
            const dbRoom = await createRoom(dbGuild, { roomId: channelID })

            const oldState = discord.mockVoiceState(guild, { channelID: channelID, member: member })
            const newState = discord.mockVoiceState(guild, { channelID: newChannelId, member: member })

            jest.clearAllMocks()
            const joinSpy = jest.spyOn(eventInstance as any, "handleVoiceJoin")
            const leaveSpy = jest.spyOn(eventInstance as any, "handleVoiceLeave")
            const saveGuildSpy = jest.spyOn(GuildModel.prototype as any, 'save');
            const saveRoomSpy = jest.spyOn(RoomModel.prototype as any, 'save');

            await eventInstance.execute(oldState, newState)

            expect(joinSpy).toHaveBeenCalledTimes(newChannelId ? 1 : 0)
            expect(leaveSpy).toHaveBeenCalledTimes(1)
            expect(saveGuildSpy).toHaveBeenCalledTimes(0);
            expect(saveRoomSpy).toHaveBeenCalledTimes(1);
            const saveRoomSpyRes = await saveRoomSpy.mock.results[0].value;
            expect(saveRoomSpyRes.events).toHaveLength(1);
            expect(saveRoomSpyRes.events[0].type).toBe("user_leave");
        })
    })
})