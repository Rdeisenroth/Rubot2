import { MockDiscord } from "@tests/mockDiscord";
import { mongoose } from "@typegoose/typegoose";
import { ChatInputCommandInteraction, ChannelType, VoiceState, Colors } from "discord.js";
import VoiceLockCommand from "./VoiceLockCommand";
import exp from "constants";

describe("VoiceLockCommand", () => {
    const command = VoiceLockCommand;
    const discord = new MockDiscord();
    let commandInstance: VoiceLockCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(() => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
        jest.restoreAllMocks();
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("lock");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Locks the current voice channel.");
    })

    it("should have no options", () => {
        expect(command.options).toHaveLength(0);
    })

    it.each(["owner", "supervisor"])("should lock the voice channel when the user is %s of the channel", async (userRole) => {
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
        const editPermissionOverwritesSpy = jest.spyOn(voiceChannel.permissionOverwrites, "edit").mockResolvedValue({} as any);

        await commandInstance.execute();

        const updatedDbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const updatedVoiceChannel = updatedDbGuild.voice_channels.find(vc => vc._id === voiceChannel.id);

        expect(updatedVoiceChannel?.locked).toBe(true);
        expect(editPermissionOverwritesSpy).toHaveBeenCalledTimes(1);
        expect(editPermissionOverwritesSpy).toHaveBeenCalledWith(interaction.guild!.roles.everyone, { "Connect": false, "Speak": false });
    })

    it.each(["owner", "supervisor"])("should send a success message when the user is %s of the channel", async (userRole) => {
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
        const replySpy = jest.spyOn(interaction, "reply");

        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Voice Channel Locked",
                    description: `The voice channel "${voiceChannel}" was locked.`,
                    color: Colors.Green
                }
            }]
        }))
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

    it("should fail if the user is not authorized to lock the room", async () => {
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
        const replySpy = jest.spyOn(interaction, 'reply')

        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Error",
                    description: "You are not authorized to lock the channel.",
                    color: Colors.Red
                }
            }]
        }))
    })

});