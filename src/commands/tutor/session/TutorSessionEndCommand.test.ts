import { InternalRoles } from "@models/BotRoles";
import { MockDiscord } from "@tests/mockDiscord";
import { createQueue, createRole, createSession } from "@tests/testutils";
import { ChatInputCommandInteraction, Colors, DataManager, GuildMember, GuildMemberRoleManager, Role } from "discord.js";
import TutorSessionEndCommand from "./TutorSessionEndCommand";
import { SessionModel } from "@models/Models";

describe("TutorSessionEndCommand", () => {
    const command = TutorSessionEndCommand;
    const discord = new MockDiscord();
    let commandInstance: TutorSessionEndCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(async () => {
        // mock role
        const guild = discord.mockGuild();
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(guild);
        await createRole(dbGuild, `active session ${guild}`, InternalRoles.ACTIVE_SESSION);
        const role = discord.mockRole(guild!, { id: InternalRoles.ACTIVE_SESSION.toString(), name: `active session ${guild}` })
        guild!.roles.resolve = jest.fn().mockReturnValue(role);
        GuildMemberRoleManager.prototype.remove = jest.fn().mockResolvedValue(role);

        interaction = discord.mockInteraction(undefined, undefined, discord.mockGuildMember(undefined, guild, [role.id]));
        commandInstance = new command(interaction, discord.getApplication());
        jest.clearAllMocks();
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("end");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Ends a tutor session.");
    })

    it("should have no options", () => {
        expect(command.options).toHaveLength(0);
    })

    it("should defer the interaction", async () => {
        const deferSpy = jest.spyOn(interaction, 'deferReply');
        await commandInstance.execute();
        expect(deferSpy).toHaveBeenCalledTimes(1);
    })

    it("should end the tutor session and reply with it", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = await createQueue(dbGuild);
        await createSession(queue, interaction.user.id, interaction.guild!.id);

        const replySpy = jest.spyOn(interaction, 'editReply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    title: "Tutor Session Ended",
                    description: `You have ended the tutor session for queue "${queue.name}".`,
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
                    color: Colors.Green
                }
            }]
        })
    })

    it("should end the tutor session on the database", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = await createQueue(dbGuild);
        await createSession(queue, interaction.user.id, interaction.guild!.id);

        const saveSpy = jest.spyOn(SessionModel.prototype as any, 'save');
        await commandInstance.execute();

        expect(saveSpy).toHaveBeenCalledTimes(1);
        const saveSpyRes = await saveSpy.mock.results[0].value;
        expect(saveSpyRes).toMatchObject({
            active: false,
            end_certain: true,
        })
    })

    it("should remove the active session role from the user", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = await createQueue(dbGuild);
        await createSession(queue, interaction.user.id, interaction.guild!.id);

        const removeSpy = jest.spyOn(GuildMemberRoleManager.prototype, 'remove');
        await commandInstance.execute();

        expect(removeSpy).toHaveBeenCalledTimes(1);
        expect(removeSpy).toHaveBeenCalledWith(expect.objectContaining({ id: InternalRoles.ACTIVE_SESSION.toString() }));
    })

    it("should fail if the user doesn't have an active session", async () => {
        const replySpy = jest.spyOn(interaction, 'editReply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    title: "Error",
                    description: `You do not have an active session.`,
                    color: Colors.Red
                }
            }]
        })
    })
})