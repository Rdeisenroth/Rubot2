import { MockDiscord } from "@tests/mockDiscord";
import { ChatInputCommandInteraction, Colors } from "discord.js";
import TutorSessionSummaryCommand from "./TutorSesssionSummaryCommand";
import { createQueue, createSession } from "@tests/testutils";

describe("TutorSessionSummaryCommand", () => {
    const command = TutorSessionSummaryCommand;
    const discord = new MockDiscord();
    let commandInstance: TutorSessionSummaryCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(() => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("summary");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Shows a summary of the current session.");
    })

    it("should have no options", () => {
        expect(command.options).toHaveLength(0);
    })

    it("should reply with a summary of the current session", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = await createQueue(dbGuild, "test", "test description");
        await createSession(queue, interaction.user.id, interaction.guild!.id);
        
        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Session Summary",
                    fields: expect.arrayContaining([
                        {
                            name: "Time Spent",
                            value: expect.any(String),
                            inline: true,
                        }, 
                        {
                            name: "Channels Visited",
                            value: expect.any(String),
                            inline: true,
                        },
                        {
                            name: "Participants",
                            value: expect.any(String),
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
                    description: `You do not have an active session.`,
                    color: Colors.Red,
                }
            }]
        }));
    })
})