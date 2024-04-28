import { MockDiscord } from "@tests/mockDiscord";
import { ChatInputCommandInteraction, ApplicationCommandOptionType, VoiceState, ChannelType, Colors } from "discord.js";
import VoiceKickCommand from "./VoiceKickCommand";
import { mongoose } from "@typegoose/typegoose";

describe("VoiceKickCommand", () => {
    const command = VoiceKickCommand;
    const discord = new MockDiscord();
    let commandInstance: VoiceKickCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(() => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
        jest.restoreAllMocks();
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("kick");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Kicks a user from the voice channel.");
    })

    it("should have one option", () => {
        expect(command.options).toHaveLength(1);
        expect(command.options[0]).toEqual({
            name: "member",
            description: "The member to kick from the voice channel.",
            type: ApplicationCommandOptionType.User,
            required: true
        });
    })

    it.each(["owner", "supervisor"])("should kick the user from the voice channel when the initiating user is %s of the channel", async (userRole) => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

        const memberToKick = discord.mockGuildMember(undefined, interaction.guild!);
        console.log(memberToKick.id);
        const voiceChannel = discord.mockVoiceChannel(interaction.guild!, { members: [memberToKick] });

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

        const setVoiceChannelSpy = jest.spyOn(VoiceState.prototype, "setChannel").mockResolvedValue({} as any);
        jest.spyOn(VoiceState.prototype, "channel", "get").mockReturnValue(voiceChannel);

        interaction.options.get = jest.fn().mockReturnValue({ value: memberToKick.id });

        await commandInstance.execute();

        expect(setVoiceChannelSpy).toHaveBeenCalledTimes(1);
        expect(setVoiceChannelSpy).toHaveBeenCalledWith(null);
    });

    it.each(["owner", "supervisor"])("should remove the kicked user from the permission overwrites when the initiating user is %s of the channel", async (userRole) => {
        let dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

        const memberToKick = discord.mockGuildMember(undefined, interaction.guild!);
        const voiceChannel = discord.mockVoiceChannel(interaction.guild!, { members: [memberToKick] });

        dbGuild.voice_channels.push({
            _id: voiceChannel.id,
            channel_type: ChannelType.GuildVoice,
            owner: userRole === "owner" ? interaction.user.id : "123",
            managed: true,
            permitted: new mongoose.Types.Array([memberToKick.id]),
            afkhell: false,
            temporary: true,
            supervisors: userRole === "supervisor" ? [interaction.user.id] : [],
        });
        await dbGuild.save();

        jest.spyOn(VoiceState.prototype, "setChannel").mockResolvedValue({} as any);
        jest.spyOn(VoiceState.prototype, "channel", "get").mockReturnValue(voiceChannel);
        const deletePermissionOverwritesSpy = jest.spyOn(voiceChannel.permissionOverwrites, "delete").mockResolvedValue({} as any);

        interaction.options.get = jest.fn().mockReturnValue({ value: memberToKick.id });

        await commandInstance.execute();

        dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        expect(deletePermissionOverwritesSpy).toHaveBeenCalledTimes(1);
        expect(deletePermissionOverwritesSpy).toHaveBeenCalledWith(memberToKick.id);
        expect(dbGuild.voice_channels[0].permitted).not.toContain(memberToKick.id);
    })

    it.each(["owner", "supervisor"])("should send an embed with the voice channel name when the initiating user is %s of the channel", async (userRole) => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

        const memberToKick = discord.mockGuildMember(undefined, interaction.guild!);
        const voiceChannel = discord.mockVoiceChannel(interaction.guild!, { members: [memberToKick] });

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

        jest.spyOn(VoiceState.prototype, "setChannel").mockResolvedValue({} as any);
        jest.spyOn(VoiceState.prototype, "channel", "get").mockReturnValue(voiceChannel);
        const replySpy = jest.spyOn(interaction, 'reply');

        interaction.options.get = jest.fn().mockReturnValue({ value: memberToKick.id });

        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "User Kicked",
                    description: `User ${memberToKick} was kicked from the voice channel.`,
                    color: Colors.Green
                }
            }]
        }));
    })

    it("should notify if the user could not be kicked", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

        const memberToKick = discord.mockGuildMember(undefined, interaction.guild!);
        const voiceChannel = discord.mockVoiceChannel(interaction.guild!, { members: [memberToKick] });

        dbGuild.voice_channels.push({
            _id: voiceChannel.id,
            channel_type: ChannelType.GuildVoice,
            owner: interaction.user.id,
            managed: true,
            permitted: new mongoose.Types.Array(),
            afkhell: false,
            temporary: true,
            supervisors: [],
        });
        await dbGuild.save();

        jest.spyOn(VoiceState.prototype, "channel", "get").mockReturnValue(voiceChannel);
        const replySpy = jest.spyOn(interaction, 'reply');

        interaction.options.get = jest.fn().mockReturnValue({ value: memberToKick.id });

        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Error",
                    description: `Could not kick user ${memberToKick} from the voice channel.`,
                    color: Colors.Red
                }
            }]
        }));
    })

    it("should fail if the user to kick is the owner of the channel", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

        const memberToKick = discord.mockGuildMember(undefined, interaction.guild!);
        const voiceChannel = discord.mockVoiceChannel(interaction.guild!, { members: [memberToKick] });

        dbGuild.voice_channels.push({
            _id: voiceChannel.id,
            channel_type: ChannelType.GuildVoice,
            owner: memberToKick.id,
            managed: true,
            permitted: new mongoose.Types.Array(),
            afkhell: false,
            temporary: true,
            supervisors: [interaction.user.id],
        });
        await dbGuild.save();

        jest.spyOn(VoiceState.prototype, "channel", "get").mockReturnValue(voiceChannel);
        const replySpy = jest.spyOn(interaction, 'reply');

        interaction.options.get = jest.fn().mockReturnValue({ value: memberToKick.id });

        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Error",
                    description: "You are not authorized to kick the owner of the channel.",
                    color: Colors.Red
                }
            }]
        }));
    })


    it("should fail if the user is not in a voice channel", async () => {
        const memberToKick = discord.mockGuildMember(undefined, interaction.guild!);
        interaction.options.get = jest.fn().mockReturnValue({ value: memberToKick.id });

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

        const memberToKick = discord.mockGuildMember(undefined, interaction.guild!);
        interaction.options.get = jest.fn().mockReturnValue({ value: memberToKick.id });

        const voiceChannel = discord.mockVoiceChannel(interaction.guild!, { members: [memberToKick] });

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

    it("should fail if the user is not authorized to close the channel", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

        const memberToKick = discord.mockGuildMember(undefined, interaction.guild!);
        interaction.options.get = jest.fn().mockReturnValue({ value: memberToKick.id });

        const voiceChannel = discord.mockVoiceChannel(interaction.guild!, { members: [memberToKick] });

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
                    description: "You are not authorized to kick a member from the channel.",
                    color: Colors.Red
                }
            }]
        }))
    })
});