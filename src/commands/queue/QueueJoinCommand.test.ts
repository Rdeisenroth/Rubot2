import { MockDiscord } from "@tests/mockDiscord";
import { ChatInputCommandInteraction, Colors, EmbedBuilder } from "discord.js";
import { container } from "tsyringe";
import QueueJoinCommand from "./QueueJoinCommand";
import { SessionModel, SessionRole } from "@models/Session";
import { createQueue } from "@tests/testutils";
import { GuildModel } from "@models/Guild";

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
        const queue = await createQueue(dbGuild, queueName, "test description");

        jest.clearAllMocks();
        const saveSpy = jest.spyOn(GuildModel.prototype as any, 'save');
        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(saveSpy).toHaveBeenCalledTimes(1);
        const saveSpyRes = await saveSpy.mock.results[0].value;
        expect(saveSpyRes.queues[0].entries).toHaveLength(1);
        expect(saveSpyRes.queues[0].entries[0].discord_id).toBe(interaction.user.id);
        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({
            fetchReply: true,
            embeds: [{
                data: {
                    description: expect.stringContaining(queue.join_message!.replace("${name}", queue.name).replace("${pos}", "1").replace("${total}", "1").replace("${time_spent}", "0h 0m")),
                    color: Colors.Green,
                    title: "Queue Joined"
                }
            }]
        });
    })

    it("should fail if the queue does not exist", async () => {
        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({
            fetchReply: true,
            embeds: [{
                data: {
                    title: "Error",
                    description: `Could not find the queue "${interaction.options.get("queue")!.value}".`,
                    color: Colors.Red,
                }
            }]
        });
    })

    it("should fail if the user is already in the same queue", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = await createQueue(dbGuild, "test", "test description", [{ discord_id: interaction.user.id, joinedAt: (Date.now()).toString() }]);

        jest.clearAllMocks();
        const saveSpy = jest.spyOn(GuildModel.prototype as any, 'save');
        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(saveSpy).toHaveBeenCalledTimes(0);
        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({
            fetchReply: true,
            embeds: [{
                data: {
                    title: "Error",
                    description: `You are already in the queue "${queue.name}".`,
                    color: Colors.Red,
                }
            }]
        });
    })

    it("should fail if the user is already in another queue", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = await createQueue(dbGuild, "test", "test description");
        const otherQueue = await createQueue(dbGuild, "another test", "another test description", [{ discord_id: interaction.user.id, joinedAt: (Date.now()).toString() }]);

        jest.clearAllMocks();
        const saveSpy = jest.spyOn(GuildModel.prototype as any, 'save');
        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(saveSpy).toHaveBeenCalledTimes(0);
        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({
            fetchReply: true,
            embeds: [{
                data: {
                    title: "Error",
                    description: `You are already in the queue "${otherQueue.name}".`,
                    color: Colors.Red,
                }
            }]
        });
    })

    it("should fail if the user has an active session", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = await createQueue(dbGuild, "test", "test description");

        await SessionModel.create({ active: true, user: interaction.user.id, guild: interaction.guild?.id, role: SessionRole.coach, started_at: Date.now(), end_certain: false, rooms: [] });

        jest.clearAllMocks();
        const saveSpy = jest.spyOn(GuildModel.prototype as any, 'save');
        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(saveSpy).toHaveBeenCalledTimes(0);
        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({ 
            fetchReply: true,
             embeds: [{
                data: {
                    title: "Error",
                    description: `You have an active session and cannot perform this action.`,
                    color: Colors.Red,
                }
            }]
        });
    })

    it("should fail if the queue is locked", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = await createQueue(dbGuild, "test", "test description", [], true);
        
        jest.clearAllMocks();
        const saveSpy = jest.spyOn(GuildModel.prototype as any, 'save');
        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(saveSpy).toHaveBeenCalledTimes(0);
        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({
             fetchReply: true,
              embeds: [{
                data: {
                    title: "Error",
                    description: `The queue "${queue.name}" is locked and cannot be joined.`,
                    color: Colors.Red,
                }
            }]
        });
    })
})