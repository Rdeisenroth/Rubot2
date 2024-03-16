import { MockDiscord } from "@tests/mockDiscord";
import { ChannelType, ChatInputCommandInteraction, Colors } from "discord.js";
import { container } from "tsyringe";
import RemoveQueueInfoChannelCommand from "./RemoveQueueInfoChannelCommand";
import { QueueEventType } from "@models/Event";
import { createQueue } from "@tests/testutils";
import { GuildModel } from "@models/Models";

describe("RemoveQueueInfoChannelCommand", () => {
    const command = RemoveQueueInfoChannelCommand;
    const discord = container.resolve(MockDiscord);
    let commandInstance: RemoveQueueInfoChannelCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(() => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
        interaction.options.get = jest.fn().mockImplementation((option: string) => {
            switch (option) {
                case "channel":
                    return { value: "test channel" }
                case "queue":
                    return { value: "test queue" }
                default:
                    return null
            }
        })
        interaction.guild!.channels.cache.get = jest.fn().mockImplementation((key: string) => {
            switch (key) {
                case "test channel":
                    return { id: "test channel", type: ChannelType.GuildText }
                case "another channel":
                    return { id: "another channel", type: ChannelType.GuildVoice }
                default:
                    return null
            }
        })
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("remove_info_channel");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Removes a channel from the queue info channels.");
    })

    it("should have the correct options", () => {
        expect(command.options).toHaveLength(2);
        expect(command.options[0]).toStrictEqual({
            name: "channel",
            description: "The channel to be removed from the queue info channels.",
            type: 7,
            required: true,
        });
        expect(command.options[1]).toStrictEqual({
            name: "queue",
            description: "The queue for which the info channel will be removed.",
            type: 3,
            required: true,
        });
    })

    it("should defer the interaction", async () => {
        const deferSpy = jest.spyOn(interaction, 'deferReply')
        await commandInstance.execute();

        expect(deferSpy).toHaveBeenCalledTimes(1);
    })

    it("should remove the channel from the queue info channels and reply with a success message", async () => {
        const channelName = interaction.options.get("channel")!.value as string;
        const queueName = interaction.options.get("queue")!.value as string;
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        await createQueue(dbGuild, queueName, "test description", [], false, [{ channel_id: channelName, events: Object.values(QueueEventType) }]);

        jest.clearAllMocks();
        const saveSpy = jest.spyOn(GuildModel.prototype as any, 'save');
        const replySpy = jest.spyOn(interaction, 'editReply');
        await commandInstance.execute();

        expect(saveSpy).toHaveBeenCalledTimes(1);
        const saveSpyRes = await saveSpy.mock.results[0].value;
        const queueInfoChannel = saveSpyRes.queues.find((q: any) => q.name === queueName).info_channels.find((c: any) => c.channel_id === channelName);
        expect(queueInfoChannel).toBeUndefined();
        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(
            {
                embeds: [{
                    data: {
                        title: "Queue Info Channel Removed",
                        description: `The channel "${channelName}" has been removed from the queue info channels for the queue "${queueName}".`,
                        color: Colors.Green,
                    }
                }]
            }
        );
    })

    it("should fail if the channel is not found", async () => {
        const channelName = "this channel does not exist";
        const queueName = interaction.options.get("queue")!.value as string;
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        await createQueue(dbGuild, queueName, "test description");

        interaction.options.get = jest.fn().mockImplementation((option: string) => {
            switch (option) {
                case "channel":
                    return { value: channelName }
                case "queue":
                    return { value: queueName }
                default:
                    return null
            }
        })

        const replySpy = jest.spyOn(interaction, 'editReply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(
            {
                embeds: [{
                    data: {
                        title: "Error",
                        description: `Could not find channel "${channelName}".`,
                        color: Colors.Red,
                    }
                }]
            }
        );
    })

    it("should fail if the channel is not a text channel", async () => {
        const channelName = "another channel";
        const queueName = interaction.options.get("queue")!.value as string;
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        await createQueue(dbGuild, queueName, "test description");

        interaction.options.get = jest.fn().mockImplementation((option: string) => {
            switch (option) {
                case "channel":
                    return { value: channelName }
                case "queue":
                    return { value: queueName }
                default:
                    return null
            }
        })

        const replySpy = jest.spyOn(interaction, 'editReply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(
            {
                embeds: [{
                    data: {
                        title: "Error",
                        description: `Could not find channel "${channelName}" with type "${ChannelType[ChannelType.GuildText]}".`,
                        color: Colors.Red,
                    }
                }]
            }
        );

    })

    it("should fail if the queue is not found", async () => {
        const queueName = interaction.options.get("queue")!.value as string;

        const replySpy = jest.spyOn(interaction, 'editReply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(
            {
                embeds: [{
                    data: {
                        title: "Error",
                        description: `Could not find the queue "${queueName}".`,
                        color: Colors.Red,
                    }
                }]
            }
        );
    })

    it("should fail if the channel is not an info channel for the queue", async () => {
        const channelName = interaction.options.get("channel")!.value as string;
        const queueName = interaction.options.get("queue")!.value as string;
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        await createQueue(dbGuild, queueName, "test description");

        const replySpy = jest.spyOn(interaction, 'editReply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith(
            {
                embeds: [{
                    data: {
                        title: "Error",
                        description: `The channel "${channelName}" is not a queue info channel for the queue "${queueName}".`,
                        color: Colors.Red,
                    }
                }]
            }
        );
    })

})