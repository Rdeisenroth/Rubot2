import { MockDiscord } from "@tests/mockDiscord";
import { ApplicationCommand, ApplicationCommandOptionType, ChannelType, ChatInputCommandInteraction, Colors, VoiceState } from "discord.js";
import VoiceTransferCommand from "./VoiceTransferCommand";
import { mongoose } from "@typegoose/typegoose";

describe("VoiceTransferCommand", () => {
    const command = VoiceTransferCommand;
    const discord = new MockDiscord();
    let commandInstance: VoiceTransferCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(() => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
        jest.restoreAllMocks();
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("transfer");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Transfers the ownership of the voice channel to another user.");
    })

    it("should have the correct options", () => {
        expect(command.options).toEqual([{
            name: "member",
            description: "The member to transfer the ownership to.",
            type: ApplicationCommandOptionType.User,
            required: true
        }]);
    })

    it("should transfer the ownership of the voice channel", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

        const memberToTransfer = discord.mockGuildMember(undefined, interaction.guild!);
        const voiceChannel = discord.mockVoiceChannel(interaction.guild!);

        dbGuild.voice_channels.push({
            _id: voiceChannel.id,
            channel_type: ChannelType.GuildVoice,
            owner: interaction.user.id,
            managed: true,
            permitted: new Array<string>(memberToTransfer.id),
            afkhell: false,
            locked: false,
            temporary: true,
            supervisors: [],
        });
        await dbGuild.save();

        jest.spyOn(VoiceState.prototype, "channel", "get").mockReturnValue(voiceChannel);
        const editPermissionOverwritesSpy = jest.spyOn(voiceChannel.permissionOverwrites, "edit").mockResolvedValue({} as any);

        interaction.options.get = jest.fn().mockReturnValue({ value: memberToTransfer.id });

        await commandInstance.execute();

        const updatedDbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const updatedVoiceChannel = updatedDbGuild.voice_channels.find(vc => vc._id === voiceChannel.id);

        expect(updatedVoiceChannel?.owner).toBe(memberToTransfer.id);
        expect(updatedVoiceChannel?.permitted).toContain(interaction.user.id);
        expect(updatedVoiceChannel?.permitted).not.toContain(memberToTransfer.id);
        expect(editPermissionOverwritesSpy).toHaveBeenCalledTimes(2);
        expect(editPermissionOverwritesSpy).toHaveBeenCalledWith(memberToTransfer, { "ViewChannel": true, "Connect": true, "Speak": true });
        expect(editPermissionOverwritesSpy).toHaveBeenCalledWith(interaction.member!, { "ViewChannel": true, "Connect": true, "Speak": true });
    })

    it("should send a success message", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

        const memberToTransfer = discord.mockGuildMember(undefined, interaction.guild!);
        const voiceChannel = discord.mockVoiceChannel(interaction.guild!);

        dbGuild.voice_channels.push({
            _id: voiceChannel.id,
            channel_type: ChannelType.GuildVoice,
            owner: interaction.user.id,
            managed: true,
            permitted: new Array<string>(memberToTransfer.id),
            afkhell: false,
            locked: false,
            temporary: true,
            supervisors: [],
        });
        await dbGuild.save();

        jest.spyOn(VoiceState.prototype, "channel", "get").mockReturnValue(voiceChannel);
        jest.spyOn(voiceChannel.permissionOverwrites, "edit").mockResolvedValue({} as any);
        const replySpy = jest.spyOn(interaction, "reply");

        interaction.options.get = jest.fn().mockReturnValue({ value: memberToTransfer.id });

        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Ownership Transferred",
                    description: `The ownership of the voice channel was transferred to ${memberToTransfer}.`,
                    color: Colors.Green
                }
            }]
        }));

    })

    it("should fail if the user is only supervisor, not owner", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

        const memberToTransfer = discord.mockGuildMember(undefined, interaction.guild!);
        const voiceChannel = discord.mockVoiceChannel(interaction.guild!);

        dbGuild.voice_channels.push({
            _id: voiceChannel.id,
            channel_type: ChannelType.GuildVoice,
            owner: "123",
            managed: true,
            permitted: new Array<string>(memberToTransfer.id),
            afkhell: false,
            locked: false,
            temporary: true,
            supervisors: [interaction.user.id],
        });
        await dbGuild.save();

        jest.spyOn(VoiceState.prototype, "channel", "get").mockReturnValue(voiceChannel);
        jest.spyOn(voiceChannel.permissionOverwrites, "edit").mockResolvedValue({} as any);
        const replySpy = jest.spyOn(interaction, "reply");

        interaction.options.get = jest.fn().mockReturnValue({ value: memberToTransfer.id });

        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(expect.objectContaining({
            embeds: [{
                data: {
                    title: "Error",
                    description: "You are not authorized to transfer the ownership of the voice channel, since you are not the owner.",
                    color: Colors.Red
                }
            }]
        }));
    })

    it("should fail if the user to transfer to is not in the guild", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);

        const memberToTransfer = discord.mockGuildMember();
        const voiceChannel = discord.mockVoiceChannel(interaction.guild!);

        dbGuild.voice_channels.push({
            _id: voiceChannel.id,
            channel_type: ChannelType.GuildVoice,
            owner: interaction.user.id,
            managed: true,
            permitted: new Array<string>(),
            afkhell: false,
            locked: false,
            temporary: true,
            supervisors: [],
        });
        await dbGuild.save();

        jest.spyOn(VoiceState.prototype, "channel", "get").mockReturnValue(voiceChannel);
        jest.spyOn(voiceChannel.permissionOverwrites, "edit").mockResolvedValue({} as any);
        const replySpy = jest.spyOn(interaction, "reply");

        interaction.options.get = jest.fn().mockReturnValue({ value: memberToTransfer.id });

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
        }));
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

    it("should fail if the user is not authorized to transfer the ownership of the voice channel", async () => {
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
                    description: "You are not authorized to transfer the ownership of the voice channel, since you are not the owner.",
                    color: Colors.Red
                }
            }]
        }))
    })
});