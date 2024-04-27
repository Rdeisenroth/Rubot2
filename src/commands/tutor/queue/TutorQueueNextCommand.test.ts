import { MockDiscord } from "@tests/mockDiscord";
import { ChatInputCommandInteraction, ApplicationCommandOptionType, Colors, ChannelType, GuildMember, VoiceState } from "discord.js";
import TutorQueueNextCommand from "./TutorQueueNextCommand";
import { createQueue, createSession } from "@tests/testutils";
import { GuildModel } from "@models/Models";

describe("TutorQueueNextCommand", () => {
    const command = TutorQueueNextCommand;
    const discord = new MockDiscord();
    let commandInstance: TutorQueueNextCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(() => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
        jest.restoreAllMocks();
        jest.spyOn(discord.getApplication().dmManager, "sendQueuePickedMessage").mockResolvedValue();
        jest.spyOn(interaction.guild!.channels, "create").mockImplementation(() => Promise.resolve(discord.mockVoiceChannel(interaction.guild!)) as any);
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("next");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Accepts the next student(s) in the queue.");
    })

    it("should have one option", () => {
        expect(command.options).toHaveLength(1);
        expect(command.options[0]).toEqual({
            name: "amount",
            description: "The amount of students to accept.",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            default: 1,
        });
    })

    it("should defer the interaction", async () => {
        const deferSpy = jest.spyOn(interaction, 'deferReply')
        await commandInstance.execute()

        expect(deferSpy).toHaveBeenCalled()
    })

    it("should create a tutoring voice channel", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const member = discord.mockGuildMember(undefined, interaction.guild!)
        const queueEntries = [{ discord_id: member.id, joinedAt: Date.now().toString() }];
        const queue = await createQueue(dbGuild, { entries: queueEntries });
        await createSession(queue, interaction.user.id, interaction.guild!.id);

        const createVoiceChannelSpy = jest.spyOn(interaction.guild!.channels, "create").mockImplementation(() => Promise.resolve(discord.mockVoiceChannel(interaction.guild!)) as any);
        const saveSpy = jest.spyOn(GuildModel.prototype as any, "save")

        await commandInstance.execute();

        expect(createVoiceChannelSpy).toHaveBeenCalledTimes(1);
        expect(saveSpy).toHaveBeenCalledTimes(2);
        const saveSpyRes = await saveSpy.mock.results[0].value;
        expect(saveSpyRes.voice_channels).toHaveLength(1);
        expect(saveSpyRes.voice_channels[0].channel_type).toBe(ChannelType.GuildVoice);
        expect(saveSpyRes.voice_channels[0].owner).toBe(interaction.user.id);
    })

    it.each([null, 1, 2, 3])("should move the next %s students and tutor to the tutoring voice channel", async (amount) => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        var members: GuildMember[] = [];
        for (let i = 0; i < (amount ?? 1); i++) {
            const member = discord.mockGuildMember(undefined, interaction.guild!);
            members.push(member);
        }
        const queueEntries = members.map(member => ({
            discord_id: member.id,
            joinedAt: Date.now().toString(),
        }));
        const queue = await createQueue(dbGuild, { entries: queueEntries });
        await createSession(queue, interaction.user.id, interaction.guild!.id);

        const tutoringVoiceChannel = discord.mockVoiceChannel(interaction.guild!);
        jest.spyOn(interaction.guild!.channels, "create").mockImplementation(() => Promise.resolve(tutoringVoiceChannel) as any);
        const moveMembersToRoomSpy = jest.spyOn(discord.getApplication().roomManager, "moveMembersToRoom");
        const setVoiceChannelSpy = jest.spyOn(VoiceState.prototype, "setChannel").mockResolvedValue({} as any);

        if (amount) {
            interaction.options.get = jest.fn().mockReturnValue({ value: amount });
        }

        await commandInstance.execute();

        expect(moveMembersToRoomSpy).toHaveBeenCalledTimes(1);
        expect(setVoiceChannelSpy).toHaveBeenCalledTimes(amount ? amount + 1 : 2);
        expect(setVoiceChannelSpy).toHaveBeenCalledWith(tutoringVoiceChannel);
    })

    it.each([null, 1, 3])("should send an embed with the next %s students", async (amount) => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        var members: GuildMember[] = [];
        for (let i = 0; i < (amount ?? 1); i++) {
            const member = discord.mockGuildMember(undefined, interaction.guild!);
            members.push(member);
        }
        const queueEntries = members.map(member => ({
            discord_id: member.id,
            joinedAt: Date.now().toString(),
        }));
        const queue = await createQueue(dbGuild, { entries: queueEntries });
        await createSession(queue, interaction.user.id, interaction.guild!.id);

        if (amount) {
            interaction.options.get = jest.fn().mockReturnValue({ value: amount });
        }

        const tutoringVoiceChannel = discord.mockVoiceChannel(interaction.guild!);
        jest.spyOn(interaction.guild!.channels, "create").mockImplementation(() => Promise.resolve(tutoringVoiceChannel) as any);
        const replySpy = jest.spyOn(interaction, 'editReply')

        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: `Next ${amount && amount > 1 ? "Students" : "Student"}`,
                    description: `Please join ${tutoringVoiceChannel} if you are not automatically moved.\nYour Participant${amount && amount > 1 ? "s" : ""}: ${members.join(", ")}`,
                    color: Colors.Green,
                }
            }]
        }));
    })

    it.each([null, 1, 3])("should notify the %s picked students", async (amount) => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        var members: GuildMember[] = [];
        for (let i = 0; i < (amount ?? 1); i++) {
            const member = discord.mockGuildMember(undefined, interaction.guild!);
            members.push(member);
        }
        const queueEntries = members.map(member => ({
            discord_id: member.id,
            joinedAt: Date.now().toString(),
        }));
        const queue = await createQueue(dbGuild, { entries: queueEntries });
        await createSession(queue, interaction.user.id, interaction.guild!.id);

        const sendQueuePickedMessageSpy = jest.spyOn(discord.getApplication().dmManager, "sendQueuePickedMessage").mockResolvedValue();

        if (amount) {
            interaction.options.get = jest.fn().mockReturnValue({ value: amount });
        }

        await commandInstance.execute();

        expect(sendQueuePickedMessageSpy).toHaveBeenCalledTimes(amount ?? 1);
    })

    it("should reply with an error about an empty queue if the queue is empty", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = await createQueue(dbGuild);
        await createSession(queue, interaction.user.id, interaction.guild!.id);

        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Error",
                    description: `The queue "${queue.name}" is empty.`,
                    color: Colors.Red,
                }
            }]
        }));
    })

    it("should fail if the user has no active session", async () => {
        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Error",
                    description: "You do not have an active session.",
                    color: Colors.Red,
                }
            }]
        }));
    })

    it("should fail if the session has no queue", async () => {
        await createSession(null, interaction.user.id, interaction.guild!.id);

        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Error",
                    description: "Your session has no queue.",
                    color: Colors.Red,
                }
            }]
        }));
    })
});