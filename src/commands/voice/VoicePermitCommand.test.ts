import { MockDiscord } from "@tests/mockDiscord";
import { ApplicationCommandOptionType, ChannelType, ChatInputCommandInteraction, Colors, VoiceState } from "discord.js";
import VoicePermitCommand from "./VoicePermitCommand";
import { mongoose } from "@typegoose/typegoose";

describe("VoicePermitCommand", () => {
    const command = VoicePermitCommand;
    const discord = new MockDiscord();
    let commandInstance: VoicePermitCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(() => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
        jest.restoreAllMocks();
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("permit");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Permits a user to join the voice channel.");
    })

    it("should have one option", () => {
        expect(command.options).toHaveLength(1);
        expect(command.options[0]).toEqual({
            name: "member",
            description: "The member to permit to join the voice channel.",
            type: ApplicationCommandOptionType.User,
            required: true
        });
    })

    it.each(["owner", "supervisor"])("should permit a user to join the voice channel as a %s", async (userRole) => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

        const memberToPermit = discord.mockGuildMember(undefined, interaction.guild!);
        const voiceChannel = discord.mockVoiceChannel(interaction.guild!);

        dbGuild.voice_channels.push({
            _id: voiceChannel.id,
            channel_type: ChannelType.GuildVoice,
            owner: userRole === "owner" ? interaction.user.id : "123",
            managed: true,
            permitted: new mongoose.Types.Array(),
            afkhell: false,
            temporary: true,
            supervisors: userRole === "supervisor" ? [interaction.user.id] : [],
        });
        await dbGuild.save();

        jest.spyOn(VoiceState.prototype, "channel", "get").mockReturnValue(voiceChannel);
        const editPermissionOverwritesSpy = jest.spyOn(voiceChannel.permissionOverwrites, "edit").mockResolvedValue({} as any);

        interaction.options.get = jest.fn().mockReturnValue({ value: memberToPermit.id });

        await commandInstance.execute();

        const updatedDbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const updatedVoiceChannel = updatedDbGuild.voice_channels.find(vc => vc._id === voiceChannel.id);

        expect(updatedVoiceChannel?.permitted).toContain(memberToPermit.id);
        expect(editPermissionOverwritesSpy).toHaveBeenCalledTimes(1);
        expect(editPermissionOverwritesSpy).toHaveBeenCalledWith(memberToPermit, { "ViewChannel": true, "Connect": true, "Speak": true });
    });

    it.each(["owner", "supervisor"])("should send a success message when the user is %s of the channel", async (userRole) => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

        const memberToPermit = discord.mockGuildMember(undefined, interaction.guild!);
        const voiceChannel = discord.mockVoiceChannel(interaction.guild!);

        dbGuild.voice_channels.push({
            _id: voiceChannel.id,
            channel_type: ChannelType.GuildVoice,
            owner: userRole === "owner" ? interaction.user.id : "123",
            managed: true,
            permitted: new mongoose.Types.Array(),
            afkhell: false,
            temporary: true,
            supervisors: userRole === "supervisor" ? [interaction.user.id] : [],
        });
        await dbGuild.save();

        jest.spyOn(VoiceState.prototype, "channel", "get").mockReturnValue(voiceChannel);
        jest.spyOn(voiceChannel.permissionOverwrites, "edit").mockResolvedValue({} as any);
        const replySpy = jest.spyOn(interaction, "reply");

        interaction.options.get = jest.fn().mockReturnValue({ value: memberToPermit.id });

        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "User Permitted",
                    description: `User ${memberToPermit} was permitted to join the voice channel "${voiceChannel}".`,
                    color: Colors.Green
                }
            }]
        }));
    });

    it("should fail if the user to permit is not in the guild", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

        const memberToPermit = discord.mockGuildMember();
        const voiceChannel = discord.mockVoiceChannel(interaction.guild!);

        dbGuild.voice_channels.push({
            _id: voiceChannel.id,
            channel_type: ChannelType.GuildVoice,
            owner: interaction.user.id,
            managed: true,
            permitted: new mongoose.Types.Array(),
            afkhell: false,
            temporary: true,
        });
        await dbGuild.save();

        jest.spyOn(VoiceState.prototype, "channel", "get").mockReturnValue(voiceChannel);
        const replySpy = jest.spyOn(interaction, 'reply')

        interaction.options.get = jest.fn().mockReturnValue({ value: memberToPermit.id });

        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Error",
                    description: "The user is not in the guild.",
                    color: Colors.Red
                }
            }]
        }))
    })

    it("should fail if the user is not in a voice channel", async () => {
        const memberToPermit = discord.mockGuildMember(undefined, interaction.guild!);
        interaction.options.get = jest.fn().mockReturnValue({ value: memberToPermit.id });

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

    it("should fail if the voice channel is not temporary", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

        const memberToPermit = discord.mockGuildMember(undefined, interaction.guild!);
        interaction.options.get = jest.fn().mockReturnValue({ value: memberToPermit.id });

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

    it("should fail if the user is not authorized to permit a user to join the room", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

        const memberToPermit = discord.mockGuildMember(undefined, interaction.guild!);
        interaction.options.get = jest.fn().mockReturnValue({ value: memberToPermit.id });

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
        const replySpy = jest.spyOn(interaction, 'reply')

        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Error",
                    description: "You are not authorized to permit a member to join the voice channel.",
                    color: Colors.Red
                }
            }]
        }))
    })
});