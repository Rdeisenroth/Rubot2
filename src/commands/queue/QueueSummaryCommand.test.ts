import QueueSummaryCommand from "./QueueSummaryCommand";
import { MockDiscord } from "@tests/mockDiscord";
import { EmbedBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction, Colors } from "discord.js";
import { FilterOutFunctionKeys } from "@typegoose/typegoose/lib/types";
import { QueueEntry } from "@models/QueueEntry";
import { createQueue } from "@tests/testutils";

describe("InfoCommand", () => {
    const command = QueueSummaryCommand;
    const discord = new MockDiscord();
    let commandInstance: QueueSummaryCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(() => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("summary");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Displays information about the queue.");
    })

    it("should have no options", () => {
        expect(command.options).toHaveLength(0);
    })

    it("should reply with an error if the user is not in a queue", async () => {
        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({ 
             embeds: [{
                data: {
                    title: "Error",
                    description: "You are currently not in a queue.",
                    color: Colors.Red,
                }
            }]
        }));
    })

    it("should reply with the queue info if the user is in a queue", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queueEntry: FilterOutFunctionKeys<QueueEntry> = {
            discord_id: interaction.user.id,
            joinedAt: Date.now().toString(),
        };
        const queue = await createQueue(dbGuild, "test", "test description", [queueEntry]);

        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Queue Information",
                    fields: expect.arrayContaining([
                        expect.objectContaining({
                            name: "❯ Name",
                            value: queue.name,
                        }),
                        expect.objectContaining({
                            name: "❯ Description",
                            value: queue.description,
                        }),
                        expect.objectContaining({
                            name: "❯ Active Entries",
                            value: queue.entries.length.toString(),
                        }),
                        expect.objectContaining({
                            name: "❯ Your Position",
                            value: `${queue.entries.findIndex(e => e.discord_id === interaction.user.id) + 1}/${queue.entries.length}`,
                        }),
                    ]),
                }
            }]
        }));
    })
});