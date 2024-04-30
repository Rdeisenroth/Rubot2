import { MockDiscord } from "@tests/mockDiscord";
import { ChatInputCommandInteraction, Colors } from "discord.js";
import AdminSessionListCommand from "./AdminSessionListCommand";
import { createQueue, createSession } from "@tests/testutils";

describe("AdminSessionListCommand", () => {
    const command = AdminSessionListCommand;
    const discord = new MockDiscord();
    let commandInstance: AdminSessionListCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(() => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
        jest.restoreAllMocks();
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("list");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Lists all active sessions.");
    })

    it("should have no options", () => {
        expect(command.options).toHaveLength(0);
    })

    it("should defer the reply", async () => {
        const deferSpy = jest.spyOn(interaction, 'deferReply')
        await commandInstance.execute()

        expect(deferSpy).toHaveBeenCalled()
    })

    it("should list all active sessions", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

        const queue1 = await createQueue(dbGuild);
        const queue2 = await createQueue(dbGuild);
        const member1 = discord.mockGuildMember(undefined, interaction.guild!);
        const member2 = discord.mockGuildMember(undefined, interaction.guild!);
        const member3 = discord.mockGuildMember(undefined, interaction.guild!);
        const queue1session1 = await createSession(queue1, member1.id, dbGuild._id, true);
        const queue1session2 = await createSession(queue1, member2.id, dbGuild._id, true);
        const queue2session1 = await createSession(queue2, member3.id, dbGuild._id, true);

        const replySpy = jest.spyOn(interaction, "editReply");

        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Active Sessions",
                    description: "There are currently 3 active sessions.",
                    color: Colors.Green,
                    fields: expect.arrayContaining([
                        expect.objectContaining({
                            name: member1.displayName,
                            value: `- started at: <t:${Math.round((+queue1session1.started_at!) / 1000)}:f>\n- rooms: 0\n- participants: 0\n- queue: ${queue1.name}`,
                            inline: false
                        }),
                        expect.objectContaining({
                            name: member2.displayName,
                            value: `- started at: <t:${Math.round((+queue1session2.started_at!) / 1000)}:f>\n- rooms: 0\n- participants: 0\n- queue: ${queue1.name}`,
                            inline: false
                        }),
                        expect.objectContaining({
                            name: member3.displayName,
                            value: `- started at: <t:${Math.round((+queue2session1.started_at!) / 1000)}:f>\n- rooms: 0\n- participants: 0\n- queue: ${queue2.name}`,
                            inline: false
                        }),
                    ])
                },
            }]
        }))
    })
});