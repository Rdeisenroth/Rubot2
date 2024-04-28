import { MockDiscord } from "@tests/mockDiscord";
import { ChannelType, ChatInputCommandInteraction, Colors, Guild, GuildMember, VoiceChannel, VoiceState } from "discord.js";
import VoiceCloseCommand from "./VoiceCloseCommand";
import { mongoose } from "@typegoose/typegoose";

describe("VoiceCloseCommand", () => {
    const command = VoiceCloseCommand;
    const discord = new MockDiscord();
    let commandInstance: VoiceCloseCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(() => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
        jest.restoreAllMocks();
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("close");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Closes the temporary voice channel and kicks all members from it.");
    })

    it("should have no options", () => {
        expect(command.options).toHaveLength(0);
    })

    it("should defer the interaction", async () => {
        const deferSpy = jest.spyOn(interaction, 'deferReply')
        await commandInstance.execute()

        expect(deferSpy).toHaveBeenCalled()
    })

    it.each(["owner", "supervisor"])("should kick all users from the voice channel when the user is %s of the channel", async (userRole) => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

        const roomMembers = Array.from({ length: 5 }, () => discord.mockGuildMember()).concat(interaction.member as GuildMember);
        const voiceChannel = discord.mockVoiceChannel(interaction.guild!, { members: roomMembers });

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

        await commandInstance.execute();

        expect(setVoiceChannelSpy).toHaveBeenCalledTimes(6);
    })

    it.each(["owner", "supervisor"])("should send an embed with the voice channel name when the user is %s of the channel", async (userRole) => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

        const roomMembers = Array.from({ length: 5 }, () => discord.mockGuildMember()).concat(interaction.member as GuildMember);
        const voiceChannel = discord.mockVoiceChannel(interaction.guild!, { members: roomMembers });

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
        const replySpy = jest.spyOn(interaction, 'editReply')

        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Voice Channel Closed",
                    description: `All Users were kicked from the voice channel "${voiceChannel.name}". The channel should close automatically.`,
                    color: Colors.Green
                }
            }]
        }))
    })

    it("should notify if not all users could be kicked", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

        const roomMembers = Array.from({ length: 5 }, () => discord.mockGuildMember()).concat(interaction.member as GuildMember);
        const voiceChannel = discord.mockVoiceChannel(interaction.guild!, { members: roomMembers });

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
        const replySpy = jest.spyOn(interaction, 'editReply')

        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Error",
                    description: `Could not kick user ${roomMembers[0]} from the voice channel.`,
                    color: Colors.Red
                }
            }]
        }))
    })

    it("should fail if the user is not in a voice channel", async () => {
        const replySpy = jest.spyOn(interaction, 'editReply')

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

        const voiceChannel = discord.mockVoiceChannel(interaction.guild!, { members: [interaction.member as GuildMember] });

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
        const replySpy = jest.spyOn(interaction, 'editReply')

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

        const voiceChannel = discord.mockVoiceChannel(interaction.guild!, { members: [interaction.member as GuildMember] });

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
        const replySpy = jest.spyOn(interaction, 'editReply')

        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Error",
                    description: "You are not authorized to close the channel.",
                    color: Colors.Red
                }
            }]
        }))
    })
})