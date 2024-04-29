import { MockDiscord } from "@tests/mockDiscord";
import { mongoose } from "@typegoose/typegoose";
import { ChatInputCommandInteraction, ChannelType, VoiceState, PermissionOverwriteManager, Colors } from "discord.js";
import VoiceToggleVisibilityCommand from "./VoiceToggleVisibilityCommand";

describe("VoiceToggleVisibilityCommand", () => {
    const command = VoiceToggleVisibilityCommand;
    const discord = new MockDiscord();
    let commandInstance: VoiceToggleVisibilityCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(() => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
        jest.restoreAllMocks();
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("toggle_visibility");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Hides or shows the current voice channel.");
    })

    it("should have no options", () => {
        expect(command.options).toHaveLength(0);
    })

    describe.each(["hide", "show"])("%s the voice channel", (action) => {
        it.each(["owner", "supervisor"])("when the user is %s of the channel", async (userRole) => {
            const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

            const voiceChannel = discord.mockVoiceChannel(interaction.guild!);

            dbGuild.voice_channels.push({
                _id: voiceChannel.id,
                channel_type: ChannelType.GuildVoice,
                owner: userRole === "owner" ? interaction.user.id : "123",
                managed: true,
                permitted: new mongoose.Types.Array(),
                afkhell: false,
                locked: false,
                temporary: true,
                supervisors: userRole === "supervisor" ? [interaction.user.id] : [],
            });
            await dbGuild.save();

            jest.spyOn(VoiceState.prototype, "channel", "get").mockReturnValue(voiceChannel);
            jest.spyOn(commandInstance as any, "shouldHideChannel").mockReturnValue(action === "hide");
            const editPermissionOverwritesSpy = jest.spyOn(voiceChannel.permissionOverwrites, "edit").mockResolvedValue({} as any);

            await commandInstance.execute();

            expect(editPermissionOverwritesSpy).toHaveBeenCalledTimes(1);
            expect(editPermissionOverwritesSpy).toHaveBeenCalledWith(interaction.guild!.roles.everyone, { "ViewChannel": action === "hide" ? false : true });
        })

        it.each(["owner", "supervisor"])("and send a success message when the user is %s of the channel", async (userRole) => {
            const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

            const voiceChannel = discord.mockVoiceChannel(interaction.guild!);

            dbGuild.voice_channels.push({
                _id: voiceChannel.id,
                channel_type: ChannelType.GuildVoice,
                owner: userRole === "owner" ? interaction.user.id : "123",
                managed: true,
                permitted: new mongoose.Types.Array(),
                afkhell: false,
                locked: false,
                temporary: true,
                supervisors: userRole === "supervisor" ? [interaction.user.id] : [],
            });
            await dbGuild.save();

            jest.spyOn(VoiceState.prototype, "channel", "get").mockReturnValue(voiceChannel);
            jest.spyOn(commandInstance as any, "shouldHideChannel").mockReturnValue(action === "hide");
            const replySpy = jest.spyOn(interaction, "reply");

            await commandInstance.execute();

            expect(replySpy).toHaveBeenCalledTimes(1);
            expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
                embeds: [{
                    data: {
                        title: `Voice Channel ${action === "hide" ? "Hidden" : "Visible"}`,
                        description: `The voice channel "${voiceChannel}" is now ${action === "hide" ? "hidden" : "visible"}.`,
                        color: Colors.Green,
                    }
                }]
            }));
        });

        it("should fail if the voice channel is not temporary", async () => {
            const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

            const voiceChannel = discord.mockVoiceChannel(interaction.guild!);

            dbGuild.voice_channels.push({
                _id: voiceChannel.id,
                channel_type: ChannelType.GuildVoice,
                owner: interaction.user.id,
                managed: true,
                permitted: new mongoose.Types.Array(),
                afkhell: false,
                temporary: false,
            });
            await dbGuild.save();

            jest.spyOn(VoiceState.prototype, "channel", "get").mockReturnValue(voiceChannel);
            const replySpy = jest.spyOn(interaction, 'reply')

            await commandInstance.execute();

            expect(replySpy).toHaveBeenCalledTimes(1);
            expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
                embeds: [{
                    data: {
                        title: "Error",
                        description: "The voice channel is not temporary.",
                        color: Colors.Red
                    }
                }]
            }))
        })

        it("should fail if the user is not authorized to show or hide the room", async () => {
            const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

            const voiceChannel = discord.mockVoiceChannel(interaction.guild!);

            dbGuild.voice_channels.push({
                _id: voiceChannel.id,
                channel_type: ChannelType.GuildVoice,
                owner: "123",
                managed: true,
                permitted: new mongoose.Types.Array(),
                afkhell: false,
                temporary: true,
            });
            await dbGuild.save();

            jest.spyOn(VoiceState.prototype, "channel", "get").mockReturnValue(voiceChannel);
            jest.spyOn(commandInstance as any, "shouldHideChannel").mockReturnValue(action === "hide");
            const replySpy = jest.spyOn(interaction, 'reply')

            await commandInstance.execute();

            expect(replySpy).toHaveBeenCalledTimes(1);
            expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
                embeds: [{
                    data: {
                        title: "Error",
                        description: `You are not authorized to ${action} the channel.`,
                        color: Colors.Red
                    }
                }]
            }))
        })
    })

    it("should fail if the user is not in a voice channel", async () => {
        const replySpy = jest.spyOn(interaction, 'reply')

        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Error",
                    description: "You are currently not in a voice channel.",
                    color: Colors.Red
                }
            }]
        }))
    })
});