import { MockDiscord } from "@tests/mockDiscord";
import { ChatInputCommandInteraction, Colors } from "discord.js";
import TutorSummaryCommand from "./TutorSummaryCommand";
import { createQueue, createSession } from "@tests/testutils";

describe("TutorSummaryCommand", () => {
    const command = TutorSummaryCommand;
    const discord = new MockDiscord();
    let commandInstance: TutorSummaryCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(() => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("summary");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Shows a summary of all your Sessions.");
    })

    it("should have no options", () => {
        expect(command.options).toHaveLength(0);
    })

    it("should reply with a summary of all your Sessions when you had no session", async () => {
        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Summary",
                    description: "You had 0 sessions.",
                    color: Colors.Green,
                }
            }]
        }));
    })

    it.each([1, 2, 3])(`should reply with a summary of all your Sessions when you had %s sessions`, async (numberOfSessions) => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = await createQueue(dbGuild, "test", "test description");
        const sessions = [];
        for (let i = 0; i < numberOfSessions; i++) {
            const session = await createSession(queue, interaction.user.id, interaction.guild!.id);
            sessions.push(session);
        }
        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Summary",
                    description: `You had ${numberOfSessions} ${numberOfSessions === 1 ? "session" : "sessions"}.`,
                    color: Colors.Green,
                    fields: expect.arrayContaining([
                        {
                            name: "Time Spent",
                            value: expect.any(String),
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
                }
            }]
        }));
    })
})