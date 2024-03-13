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
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("leave");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Leaves the queue.");
    })

    it("should have no options", () => {
        expect(command.options).toHaveLength(0);
    })

    it("should leave the queue and reply with a success message", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = {
            name: "test",
            description: "test description",
            tracks: [],
            leave_message: "You Left the `${name}` queue.\nTotal Time Spent: ${time_spent}",
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
                        description: expect.stringContaining(queue.leave_message.replace("${name}", queue.name).replace("${time_spent}", "0h 0m")),
                        color: Colors.Green,
                        title: "Queue Left"
                    }
                }]
            }
        );
    })

    it("should fail if the user is not in a queue", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = {
            name: "test",
            description: "test description",
            tracks: [],
            leave_message: "You Left the `${name}` queue.\nTotal Time Spent: ${time_spent}",
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
                        description: `You are currently not in a queue.`,
                        color: Colors.Red,
                        title: "Error"
                    }
                }]
            }
        );
    })
})
