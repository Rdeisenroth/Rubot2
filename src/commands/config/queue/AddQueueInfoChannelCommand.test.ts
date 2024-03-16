import { MockDiscord } from "@tests/mockDiscord";
import { ApplicationCommandOptionType, ChannelType, ChatInputCommandInteraction, Colors } from "discord.js";
import { container } from "tsyringe";
import AddQueueInfoChannelCommand from "./AddQueueInfoChannelCommand";
import { QueueEventType } from "@models/Event";
import { createQueue } from "@tests/testutils";
import { GuildModel } from "@models/Models";

describe("AddQueueInfoChannelCommand", () => {
    const command = AddQueueInfoChannelCommand;
    const discord = container.resolve(MockDiscord);
    let commandInstance: AddQueueInfoChannelCommand;
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
                case "events":
                    return { value: `${Object.values(QueueEventType).join(", ")}` }
                default:
                    return null;
            }
        })
        interaction.guild!.channels.cache.get = jest.fn().mockImplementation((key: string) => {
            if (key == "test channel") {
                return {
                    id: "test channel",
                    type: ChannelType.GuildText,
                }
            } else if (key == "another channel") {
                return {
                    id: "another channel",
                    type: ChannelType.GuildVoice,
                }
            } else {
                return null;
            }
        })
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("add_info_channel");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Adds a channel to the queue info channels.");
    })

    it("should have the correct options", () => {
        expect(command.options).toHaveLength(3);
        expect(command.options[0]).toStrictEqual({
            name: "channel",
            description: "The channel to be added to the queue info channels.",
            type: ApplicationCommandOptionType.Channel,
            required: true,
        });
        expect(command.options[1]).toStrictEqual({
            name: "queue",
            description: "The queue for which the info channel will be set.",
            type: ApplicationCommandOptionType.String,
            required: true,
        });
        expect(command.options[2]).toStrictEqual({
            name: "events",
            description: `${Object.values(QueueEventType).join(", ")} (defaults to all)`,
            type: ApplicationCommandOptionType.String,
            required: false,
        });
    })

    it("should defer the interaction", async () => {
        const deferSpy = jest.spyOn(interaction, 'deferReply')
        await commandInstance.execute()

        expect(deferSpy).toHaveBeenCalledTimes(1)
    })

    it("should set the queue info channel and reply with a success message", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = await createQueue(dbGuild, interaction.options.get("queue")!.value as string, "test description");

        jest.clearAllMocks();
        const saveSpy = jest.spyOn(GuildModel.prototype as any, 'save');
        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute();

        expect(saveSpy).toHaveBeenCalledTimes(1);
        const saveSpyRes = await saveSpy.mock.results[0].value;
        expect(saveSpyRes.queues[0].info_channels).toHaveLength(1);
        expect(saveSpyRes.queues[0].info_channels[0]).toMatchObject({
            channel_id: "test channel",
            events: Object.values(QueueEventType)
        });
        const channelName = interaction.options.get("channel")!.value as string;
        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    title: "Queue Info Channel Added",
                    description: `The channel ${channelName} was added to the queue ${queue.name} info channels.`,
                    color: Colors.Green,
                    fields: [{
                        name: "Events",
                        value: Object.values(QueueEventType).join(", ")
                    }]
                }
            }]
        });
    })

    it("should fail if the channel is not found", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        await createQueue(dbGuild, interaction.options.get("queue")!.value as string, "test description");

        interaction.options.get = jest.fn().mockImplementation((option: string) => {
            switch (option) {
                case "channel":
                    return { value: "this channel does not exist" }
                case "queue":
                    return { value: "test queue" }
                case "events":
                    return { value: `${Object.values(QueueEventType).join(", ")}` }
                default:
                    return null;
            }
        })

        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute();

        const channelName = interaction.options.get("channel")!.value as string;
        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    title: "Error",
                    description: `Could not find channel "${channelName}".`,
                    color: Colors.Red
                }
            }]
        });
    })

    it("should fail if the queue is not found", async () => {
        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    title: "Error",
                    description: `Could not find the queue "${interaction.options.get("queue")!.value}".`,
                    color: Colors.Red
                }
            }]
        });
    })

    it("should fail if the event is not valid", async () => {
        interaction.options.get = jest.fn().mockImplementation((option: string) => {
            switch (option) {
                case "channel":
                    return { value: "test channel" }
                case "queue":
                    return { value: "test queue" }
                case "events":
                    return { value: "invalidevent" }
                default:
                    return null;
            }
        })

        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        await createQueue(dbGuild, interaction.options.get("queue")!.value as string, "test description");

        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute();

        const eventNames = interaction.options.get("events")!.value as string;
        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    title: "Error",
                    description: `Invalid event: "${eventNames}". Valid events: "${Object.values(QueueEventType).join(`", "`)}".`,
                    color: Colors.Red
                }
            }]
        });
    })

    it("should fail if the channel is not a text channel", async () => {
        interaction.options.get = jest.fn().mockImplementation((option: string) => {
            switch (option) {
                case "channel":
                    return { value: "another channel" }
                case "queue":
                    return { value: "test queue" }
                case "events":
                    return { value: `${Object.values(QueueEventType).join(", ")}` }
                default:
                    return null;
            }
        })

        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        await createQueue(dbGuild, interaction.options.get("queue")!.value as string, "test description");

        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute();

        const channelName = interaction.options.get("channel")!.value as string;
        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    title: "Error",
                    description: `Could not find channel "${channelName}" with type "${ChannelType[ChannelType.GuildText]}".`,
                    color: Colors.Red
                }
            }]
        });
    })

    it("should fail if the channel is already a queue info channel", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queue = await createQueue(dbGuild, interaction.options.get("queue")!.value as string, "test description", [], false, [{ channel_id: "test channel", events: Object.values(QueueEventType) }]);

        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute();

        const channelName = interaction.options.get("channel")!.value as string;
        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({
            embeds: [{
                data: {
                    title: "Error",
                    description: `The channel "${channelName}" is already a queue info channel for the queue "${queue.name}".`,
                    color: Colors.Red
                }
            }]
        });
    })
})