import QueueInfoCommand from "./QueueInfoCommand";
import { MockDiscord } from "@tests/mockDiscord";
import { Queue } from "@models/Queue";
import { mongoose } from "@typegoose/typegoose";
import { EmbedBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction, Colors } from "discord.js";
import { FilterOutFunctionKeys } from "@typegoose/typegoose/lib/types";
import { QueueEntry } from "@models/QueueEntry";
import { QueueManager } from "@managers";

describe("InfoCommand", () => {
    const command = QueueInfoCommand;
    const discord = new MockDiscord();
    let commandInstance: QueueInfoCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(() => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("info");
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Displays information about the queue.");
    })

    it("should have no options", () => {
        expect(command.options).toHaveLength(0);
    })

    it("should reply with an error if the user is not in a queue", async () => {
        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({ fetchReply: true, embeds: expect.anything() });

        const messageContent = replySpy.mock.calls[0][0] as { embeds: EmbedBuilder[] };
        expect(messageContent.embeds).toBeDefined();
        const embeds = messageContent.embeds;
        expect(embeds).toHaveLength(1);
        const embed = embeds[0];
        const embedData = embed.data;

        expect(embedData).toEqual({
            title: "Error",
            description: "You are currently not in a queue.",
            color: Colors.Red,
        });
    })

    it("should reply with the queue info if the user is in a queue", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queueEntry: FilterOutFunctionKeys<QueueEntry> = { 
            discord_id: interaction.user.id,
            joinedAt: Date.now().toString(),
        };
        const queue: FilterOutFunctionKeys<Queue> = {
            name: "test",
            description: "test description",
            entries: new mongoose.Types.DocumentArray([queueEntry]),
            info_channels: [],
            opening_times: new mongoose.Types.DocumentArray([]),
        };
        dbGuild.queues.push(queue);
        await dbGuild.save();
        const replySpy = jest.spyOn(interaction, 'reply');
        await commandInstance.execute();

        expect(replySpy).toHaveBeenCalledTimes(1);
        expect(replySpy).toHaveBeenCalledWith({ fetchReply: true, embeds: expect.anything() });

        const messageContent = replySpy.mock.calls[0][0] as { embeds: EmbedBuilder[] };
        expect(messageContent.embeds).toBeDefined();
        const embeds = messageContent.embeds;
        expect(embeds).toHaveLength(1);
        const embed = embeds[0];
        const embedData = embed.data;

        expect(embedData).toEqual({
            title: "Queue Information",
            fields: expect.arrayContaining([
                expect.objectContaining({
                    name: "❯ Name",
                    value: "test",
                }),
                expect.objectContaining({
                    name: "❯ Description",
                    value: "test description",
                }),
                expect.objectContaining({
                    name: "❯ Active Entries",
                    value: "1",
                }),
                expect.objectContaining({
                    name: "❯ Your Position",
                    value: "1/1",
                }),
            ]),
        });
    })
});