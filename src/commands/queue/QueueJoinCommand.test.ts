import { MockDiscord } from "@tests/mockDiscord";
import { ChatInputCommandInteraction, Colors, EmbedBuilder } from "discord.js";
import { container } from "tsyringe";
import QueueJoinCommand from "./QueueJoinCommand";
import { SessionModel, SessionRole } from "@models/Session";

describe("QueueJoinCommand", () => {
    const command = QueueJoinCommand;
    const discord = container.resolve(MockDiscord);
    let commandInstance: QueueJoinCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(() => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
        interaction.options.get = jest.fn().mockImplementation((option: string) => {
            switch (option) {
                case "queue":
                    return { value: "test" }
                case "intent":
                    return { value: "" }
                default:
                    return null;
            }
        })
    })

    it("should have the correct name", () => {
        expect(command.name).toBe("join");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Joins the queue.");
    })

    it("should have the correct options", () => {
        expect(command.options).toHaveLength(2);
        expect(command.options[0]).toStrictEqual({
            name: "queue",
            description: "The queue to join.",
            type: 3,
            required: true,
        });
        expect(command.options[1]).toStrictEqual({
            name: "intent",
            description: "The intent of joining the queue.",
            type: 3,
            required: false,
        });
    })

    it.each([true, false])("should join the queue and reply with a success message (parameter is lowercase: %p)", async (isLowercase) => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const actualQueueName = interaction.options.get("queue")!.value as string
        const queueName = isLowercase ? actualQueueName.toLowerCase() : actualQueueName.toUpperCase();
        const queue = {
            name: queueName,
            description: "test description",
            tracks: [],
            join_message: "You joined the ${name} queue.\n\\> Your Position: ${pos}/${total}\n\\> Total Time Spent: ${time_spent}",
        }
        dbGuild.queues.push(queue)
        await dbGuild.save()

        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({ fetchReply: true, embeds: expect.anything() });
        
        const messageContent = replySpy.mock.calls[0][0] as { embeds: EmbedBuilder[] };
        expect(messageContent.embeds).toBeDefined();
        const embeds = messageContent.embeds;
        expect(embeds).toHaveLength(1);
        const embed = embeds[0];
        const embedData = embed.data;

        expect(embedData).toEqual({
            title: "Queue Joined",
            description: expect.stringContaining(queue.join_message.replace("${name}", queue.name).replace("${pos}", "1").replace("${total}", "1").replace("${time_spent}", "0h 0m")),
            color: Colors.Green,
        });
    })

    it("should fail if the queue does not exist", async () => {
        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({ fetchReply: true, embeds: expect.anything() });

        const messageContent = replySpy.mock.calls[0][0] as { embeds: EmbedBuilder[] };
        expect(messageContent.embeds).toBeDefined();
        const embeds = messageContent.embeds;
        expect(embeds).toHaveLength(1);
        const embed = embeds[0];
        const embedData = embed.data;

        expect(embedData).toEqual({
            title: "Error",
            description: `Could not find the queue "${interaction.options.get("queue")!.value}".`,
            color: Colors.Red,
        });
    })

    it("should fail if the user is already in the same queue", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = {
            name: "test",
            description: "test description",
            tracks: [],
            entries: [ { discord_id: interaction.user.id, joinedAt: Date.now().toString() } ]
        }
        dbGuild.queues.push(queue)
        await dbGuild.save()

        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({ fetchReply: true, embeds: expect.anything() });

        const messageContent = replySpy.mock.calls[0][0] as { embeds: EmbedBuilder[] };
        expect(messageContent.embeds).toBeDefined();
        const embeds = messageContent.embeds;
        expect(embeds).toHaveLength(1);
        const embed = embeds[0];
        const embedData = embed.data;

        expect(embedData).toEqual({
            title: "Error",
            description: `You are already in the queue "${queue.name}".`,
            color: Colors.Red,
        });
    })

    it("should fail if the user is already in another queue", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = {
            name: "test",
            description: "test description",
            tracks: [],
        }
        const otherQueue = {
            name: "another test",
            description: "another test description",
            tracks: [],
            entries: [ { discord_id: interaction.user.id, joinedAt: Date.now().toString() } ]
        }
        dbGuild.queues.push(queue, otherQueue)
        await dbGuild.save()

        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({ fetchReply: true, embeds: expect.anything() });

        const messageContent = replySpy.mock.calls[0][0] as { embeds: EmbedBuilder[] };
        expect(messageContent.embeds).toBeDefined();
        const embeds = messageContent.embeds;
        expect(embeds).toHaveLength(1);
        const embed = embeds[0];
        const embedData = embed.data;

        expect(embedData).toEqual({
            title: "Error",
            description: `You are already in the queue "${otherQueue.name}".`,
            color: Colors.Red,
        });

    })

    it("should fail if the user has an active session", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = {
            name: "test",
            description: "test description",
            tracks: [],
        }
        dbGuild.queues.push(queue)
        await dbGuild.save()

        await SessionModel.create({ active: true, user: interaction.user.id, guild: interaction.guild?.id, role: SessionRole.coach, started_at: Date.now(), end_certain: false, rooms: [] });

        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({ fetchReply: true, embeds: expect.anything() });

        const messageContent = replySpy.mock.calls[0][0] as { embeds: EmbedBuilder[] };
        expect(messageContent.embeds).toBeDefined();
        const embeds = messageContent.embeds;
        expect(embeds).toHaveLength(1);
        const embed = embeds[0];
        const embedData = embed.data;

        expect(embedData).toEqual({
            title: "Error",
            description: `You have an active session and cannot join the queue.`,
            color: Colors.Red,
        });
    })

    it("should fail if the queue is locked", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = {
            name: "test",
            description: "test description",
            tracks: [],
            locked: true,
        }
        dbGuild.queues.push(queue)
        await dbGuild.save()

        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({ fetchReply: true, embeds: expect.anything() });

        const messageContent = replySpy.mock.calls[0][0] as { embeds: EmbedBuilder[] };
        expect(messageContent.embeds).toBeDefined();
        const embeds = messageContent.embeds;
        expect(embeds).toHaveLength(1);
        const embed = embeds[0];
        const embedData = embed.data;

        expect(embedData).toEqual({
            title: "Error",
            description: `The queue "${queue.name}" is locked and cannot be joined.`,
            color: Colors.Red,
        });
    })
})