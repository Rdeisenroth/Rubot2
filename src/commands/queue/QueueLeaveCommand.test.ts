import { MockDiscord } from "@tests/mockDiscord";
import { ChatInputCommandInteraction, Colors } from "discord.js";
import { container } from "tsyringe";
import QueueLeaveCommand from "./QueueLeaveCommand";

describe("QueueLeaveCommand", () => {
    const command = QueueLeaveCommand;
    const discord = container.resolve(MockDiscord);
    let commandInstance: QueueLeaveCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(() => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
        interaction.options.get = jest.fn().mockImplementation((option: string) => {
            switch (option) {
                case "queue":
                    return { value: "test" }
                default:
                    return null;
            }
        })
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("leave");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Leaves the queue.");
    })

    it("should have the correct options", () => {
        expect(command.options).toHaveLength(1);
        expect(command.options[0]).toStrictEqual({
            name: "queue",
            description: "The queue to leave.",
            type: 3,
            required: true,
        });
    })

    it.each([true, false])("should leave the queue and reply with a success message (parameter is lowercase: %p)", async (isLowercase) => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const actualQueueName = interaction.options.get("queue")!.value as string
        const queueName = isLowercase ? actualQueueName.toLowerCase() : actualQueueName.toUpperCase();
        const queue = {
            name: queueName,
            description: "test description",
            tracks: [],
            leave_message: "You left the ${name} queue.",
            entries: [{ discord_id: interaction.user.id, joinedAt: (Date.now()).toString() }],
        }
        dbGuild.queues.push(queue);
        await dbGuild.save();

        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(
            {
                fetchReply: true,
                embeds: [{
                    data: {
                        description: queue.leave_message.replace("${name}", queue.name),
                        color: Colors.Green,
                        title: "Queue Left"
                    }
                }]
            }
        );
    })

    it("should fail if the queue does not exist", async () => {
        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(
            {
                fetchReply: true,
                embeds: [{
                    data: {
                        description: `Could not find the queue "test".`,
                        color: Colors.Red,
                        title: "Error"
                    }
                }]
            }
        );
    })

    it("should fail if the user is not in the queue", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queueName = interaction.options.get("queue")!.value as string
        const queue = {
            name: queueName,
            description: "test description",
            tracks: [],
            leave_message: "You left the ${name} queue.",
        }
        dbGuild.queues.push(queue);
        await dbGuild.save();

        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(
            {
                fetchReply: true,
                embeds: [{
                    data: {
                        description: `You are currently not in the queue "test".`,
                        color: Colors.Red,
                        title: "Error"
                    }
                }]
            }
        );
    })
})
