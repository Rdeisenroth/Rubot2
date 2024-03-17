import { MockDiscord } from "@tests/mockDiscord";
import { ChatInputCommandInteraction, ApplicationCommandOptionType, GuildMemberManager, Guild, GuildMember, Colors } from "discord.js";
import TutorQueueListCommand from "./TutorQueueListCommand";
import { createQueue, createSession } from "@tests/testutils";

describe("TutorQueueListCommand", () => {
    const command = TutorQueueListCommand;
    const discord = new MockDiscord();
    let commandInstance: TutorQueueListCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(() => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("list");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Lists the first entries of the current queue.");
    })

    it("should have one option", () => {
        expect(command.options).toHaveLength(1);
        expect(command.options[0]).toEqual({
            name: "amount",
            description: "The amount of entries to list.",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            default: 5,
        });
    })

    it.each([null, 1, 3, 5])(`should reply with a list of the first %s entries of the current queue`, async (amount) => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        var members: GuildMember[] = [];
        for (let i = 0; i < 4; i++) {
            const member = discord.mockGuildMember(undefined, interaction.guild!);
            members.push(member);
        }
        const queueEntries = members.map(member => ({
            discord_id: member.id,
            joinedAt: Date.now().toString(),
        }));
        const queue = await createQueue(dbGuild, "test", "test description", queueEntries);
        await createSession(queue, interaction.user.id, interaction.guild!.id);

        if (amount) {
            interaction.options.get = jest.fn().mockReturnValue({ value: amount });
        }

        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Queue Information",
                    description: `The queue ${queue.name} has 4 entries.`,
                    fields: queueEntries.slice(0, amount ?? 5).map((_, index) => ({
                        name: members[index].displayName,
                        value: expect.stringContaining(`Position: ${index + 1}`),
                    })),
                    color: Colors.Green,
                },
            }],
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
    });
})