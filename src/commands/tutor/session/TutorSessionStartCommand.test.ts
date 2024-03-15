import { MockDiscord } from "@tests/mockDiscord";
import { ChatInputCommandInteraction, Colors, GuildMemberRoleManager } from "discord.js";
import TutorSessionStartCommand from "./TutorSessionStartCommand";
import { InternalRoles, RoleScopes } from "@models/BotRoles";
import { createQueue, createRole } from "@tests/testutils";
import { Session, SessionModel, SessionRole } from "@models/Session";

describe("TutorSessionStartCommand", () => {
    const command = TutorSessionStartCommand;
    const discord = new MockDiscord();
    let commandInstance: TutorSessionStartCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(async () => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        await createRole(dbGuild, `active session ${interaction.guild}`, InternalRoles.ACTIVE_SESSION);
        const role = discord.mockRole(interaction.guild!, { id: InternalRoles.ACTIVE_SESSION.toString() })
        interaction.guild!.roles.resolve = jest.fn().mockReturnValue(role);
        GuildMemberRoleManager.prototype.add = jest.fn().mockResolvedValue(role);
        jest.clearAllMocks();
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("start");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Starts a tutor session.");
    })

    it("should have the correct options", () => {
        expect(command.options).toHaveLength(1);
        expect(command.options[0]).toStrictEqual({
            name: "queue",
            description: "The queue to start the tutor session for.",
            type: 3,
            required: false,
        });
    })

    it("should defer the interaction", async () => {
        const deferSpy = jest.spyOn(interaction, 'deferReply');
        await commandInstance.execute();
        expect(deferSpy).toHaveBeenCalledTimes(1);
    })

    it.each([true, false])("should reply with the started tutor session (queue parameter is provided: %p)", async (parameterSet) => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = await createQueue(dbGuild, "test", "test description");

        if (parameterSet) {
            interaction.options.get = jest.fn().mockReturnValue({ value: queue.name });
        }

        const replySpy = jest.spyOn(interaction, 'editReply');
        const saveSpy = jest.spyOn(SessionModel.prototype as any, 'save');
        await commandInstance.execute();

        expect(saveSpy).toHaveBeenCalledTimes(1);
        const saveSpyRes = await saveSpy.mock.results[0].value
        expect(saveSpyRes).toMatchObject({
            user: interaction.user.id,
            queue: queue._id,
            guild: interaction.guild!.id,
            role: SessionRole.coach,
            active: true,
            end_certain: false,
            rooms: []
        });

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    title: "Tutor Session Started",
                    description: `You have started a tutor session for queue "test".`,
                    color: Colors.Green,
                }
            }]
        })
    })

    it.each([true, false])("should reply with the started tutor session (queue parameter is provided: %p)", async (parameterSet) => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = await createQueue(dbGuild, "test", "test description");

        if (parameterSet) {
            interaction.options.get = jest.fn().mockReturnValue({ value: queue.name });
        }

        const replySpy = jest.spyOn(interaction, 'editReply');
        const saveSpy = jest.spyOn(SessionModel.prototype as any, 'save');
        await commandInstance.execute();

        expect(saveSpy).toHaveBeenCalledTimes(1);
        const saveSpyRes = await saveSpy.mock.results[0].value as Session;
        expect(saveSpyRes.user).toBe(interaction.user.id);
        expect(saveSpyRes.queue).toStrictEqual(queue._id);
        expect(saveSpyRes.guild).toBe(interaction.guild!.id);
        expect(saveSpyRes.role).toBe(SessionRole.coach);
        expect(saveSpyRes.active).toBe(true);
        expect(saveSpyRes.end_certain).toBe(false);
        expect(saveSpyRes.rooms).toStrictEqual([]);

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    title: "Tutor Session Started",
                    description: `You have started a tutor session for queue "test".`,
                    color: Colors.Green,
                }
            }]
        })
    })

    it("should fail if the guild has no queue", async () => {
        const replySpy = jest.spyOn(interaction, 'editReply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    title: "Error",
                    description: `The guild has no queue.`,
                    color: Colors.Red,
                }
            }]
        })
    })

    it("should fail if the queue does not exist", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        await createQueue(dbGuild, "test", "test description");

        interaction.options.get = jest.fn().mockReturnValue({ value: "nonexistent" });

        const replySpy = jest.spyOn(interaction, 'editReply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    title: "Error",
                    description: `Could not find the queue "nonexistent".`,
                    color: Colors.Red,
                }
            }]
        })
    })

    it("should fail if the user has an active session", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = await createQueue(dbGuild, "test", "test description");

        await SessionModel.create({
            queue: queue,
            user: interaction.user.id,
            guild: interaction.guild!.id,
            role: SessionRole.coach,
            active: true,
            started_at: new Date(),
            end_certain: false,
            rooms: [],
        })

        const replySpy = jest.spyOn(interaction, 'editReply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    title: "Error",
                    description: `You have an active session and cannot perform this action.`,
                    color: Colors.Red,
                }
            }]
        })
    })
})