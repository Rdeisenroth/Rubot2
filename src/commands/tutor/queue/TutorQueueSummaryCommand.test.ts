import { MockDiscord } from "@tests/mockDiscord";
import { ChatInputCommandInteraction, Colors } from "discord.js";
import TutorQueueSummaryCommand from "./TutorQueueSummaryCommand";
import { createQueue, createSession } from "@tests/testutils";

describe("TutorQueueSummaryCommand", () => {
    const command = TutorQueueSummaryCommand;
    const discord = new MockDiscord();
    let commandInstance: TutorQueueSummaryCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(() => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("summary");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Shows a summary of the current queue.");
    })

    it("should have no options", () => {
        expect(command.options).toHaveLength(0);
    })

    it("should reply with a summary of the current queue", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = await createQueue(dbGuild);
        await createSession(queue, interaction.user.id, interaction.guild!.id);

        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Queue Summary",
                    fields: expect.arrayContaining([
                        {
                            name: "Name",
                            value: queue.name,
                        }, 
                        {
                            name: "Description",
                            value: queue.description,
                        },
                        {
                            name: "Entries",
                            value: "0",
                            inline: true,
                        },
                        {
                            name: "Tutor Sessions",
                            value: "1",
                            inline: true,
                        }
                    ]),
                    color: Colors.Green,
                }
            }]
        }));
    })

    it("should fail if the user has no active session", async () => {
        const replySpy = jest.spyOn(interaction, 'reply');
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

        const replySpy = jest.spyOn(interaction, 'reply');
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
})