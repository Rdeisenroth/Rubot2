import { MockDiscord } from "@tests/mockDiscord";
import { ChatInputCommandInteraction, ApplicationCommandOptionType, ChannelType, GuildMember, VoiceState, Colors } from "discord.js";
import TutorQueuePickCommand from "./TutorQueuePickCommand";
import { GuildModel } from "@models/Models";
import { createQueue, createSession } from "@tests/testutils";

describe("TutorQueuePickCommand", () => {
    const command = TutorQueuePickCommand;
    const discord = new MockDiscord();
    let commandInstance: TutorQueuePickCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(() => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
        jest.restoreAllMocks();
        jest.spyOn(discord.getApplication().dmManager, "sendQueuePickedMessage").mockResolvedValue();
        jest.spyOn(interaction.guild!.channels, "create").mockImplementation(() => Promise.resolve(discord.mockVoiceChannel(interaction.guild!)) as any);
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("pick");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Picks a student from the queue.");
    })

    it("should have one option", () => {
        expect(command.options).toHaveLength(1);
        expect(command.options[0]).toEqual({
            name: "member",
            description: "The member of the queue to pick.",
            type: ApplicationCommandOptionType.User,
            required: true,
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

        interaction.options.get = jest.fn().mockReturnValue({ value: member.id });

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

    it("should move the picked user and the tutor to the tutoring voice channel", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const member = discord.mockGuildMember(undefined, interaction.guild!)
        const queueEntries = [{ discord_id: member.id, joinedAt: Date.now().toString() }];
        const queue = await createQueue(dbGuild, { entries: queueEntries });
        await createSession(queue, interaction.user.id, interaction.guild!.id);

        interaction.options.get = jest.fn().mockReturnValue({ value: member.id });

        const tutoringVoiceChannel = discord.mockVoiceChannel(interaction.guild!);
        jest.spyOn(interaction.guild!.channels, "create").mockImplementation(() => Promise.resolve(tutoringVoiceChannel) as any);
        const moveMembersToRoomSpy = jest.spyOn(discord.getApplication().roomManager, "moveMembersToRoom");
        const setVoiceChannelSpy = jest.spyOn(VoiceState.prototype, "setChannel").mockResolvedValue({} as any);

        await commandInstance.execute();

        expect(moveMembersToRoomSpy).toHaveBeenCalledTimes(1);
        expect(setVoiceChannelSpy).toHaveBeenCalledTimes(2);
        expect(setVoiceChannelSpy).toHaveBeenCalledWith(tutoringVoiceChannel);
    })

    it("should send an embed with the picked user", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        var members: GuildMember[] = [];
        for (let i = 0; i < 5; i++) {
            const member = discord.mockGuildMember(undefined, interaction.guild!);
            members.push(member);
        }
        const queueEntries = members.map(member => ({
            discord_id: member.id,
            joinedAt: Date.now().toString(),
        }));
        const queue = await createQueue(dbGuild, { entries: queueEntries });
        await createSession(queue, interaction.user.id, interaction.guild!.id);

        const pickedMember = members[Math.floor(Math.random() * members.length)];
        interaction.options.get = jest.fn().mockReturnValue({ value: pickedMember.id });

        const tutoringVoiceChannel = discord.mockVoiceChannel(interaction.guild!);
        jest.spyOn(interaction.guild!.channels, "create").mockImplementation(() => Promise.resolve(tutoringVoiceChannel) as any);
        const replySpy = jest.spyOn(interaction, 'editReply')

        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Student Picked",
                    description: `You picked ${pickedMember} from the queue.\nPlease join ${tutoringVoiceChannel} if you are not automatically moved.`,
                    color: Colors.Green,
                }
            }]
        }));
    })

    it("should notify the picked user", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        var members: GuildMember[] = [];
        for (let i = 0; i < 5; i++) {
            const member = discord.mockGuildMember(undefined, interaction.guild!);
            members.push(member);
        }
        const queueEntries = members.map(member => ({
            discord_id: member.id,
            joinedAt: Date.now().toString(),
        }));
        const queue = await createQueue(dbGuild, { entries: queueEntries });
        await createSession(queue, interaction.user.id, interaction.guild!.id);

        const pickedMember = members[Math.floor(Math.random() * members.length)];
        interaction.options.get = jest.fn().mockReturnValue({ value: pickedMember.id });

        const sendQueuePickedMessageSpy = jest.spyOn(discord.getApplication().dmManager, "sendQueuePickedMessage").mockResolvedValue();

        await commandInstance.execute();

        expect(sendQueuePickedMessageSpy).toHaveBeenCalledTimes(1);
    })

    it("should reply with an error if the picked user is not in the queue", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        var members: GuildMember[] = [];
        for (let i = 0; i < 5; i++) {
            const member = discord.mockGuildMember(undefined, interaction.guild!);
            members.push(member);
        }
        const queueEntries = members.map(member => ({
            discord_id: member.id,
            joinedAt: Date.now().toString(),
        }));
        const queue = await createQueue(dbGuild, { entries: queueEntries });
        await createSession(queue, interaction.user.id, interaction.guild!.id);

        const pickedMember = discord.mockGuildMember(undefined, interaction.guild!);
        interaction.options.get = jest.fn().mockReturnValue({ value: pickedMember.id });

        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Error",
                    description: `${pickedMember} is currently not in the queue "${queue.name}".`,
                    color: Colors.Red,
                }
            }]
        }));
    })

    it("should reply with an error about an empty queue if the queue is empty", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = await createQueue(dbGuild);
        await createSession(queue, interaction.user.id, interaction.guild!.id);

        const member = discord.mockGuildMember(undefined, interaction.guild!)
        interaction.options.get = jest.fn().mockReturnValue({ value: member.id });

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