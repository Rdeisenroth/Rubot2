import { MockDiscord } from "@tests/mockDiscord";
import QueueListCommand from "./QueueListCommand";
import { container } from "tsyringe";
import { ChatInputCommandInteraction, Colors, EmbedBuilder } from "discord.js";
import { Queue } from "@models/Queue";
import { FilterOutFunctionKeys } from "@typegoose/typegoose/lib/types";
import { mongoose } from "@typegoose/typegoose";

describe("QueueListCommand", () => {
    const command = QueueListCommand;
    const discord = container.resolve(MockDiscord);
    let commandInstance: QueueListCommand;
    let interaction: ChatInputCommandInteraction;

    beforeEach(() => {
        interaction = discord.mockInteraction();
        commandInstance = new command(interaction, discord.getApplication());
    });

    it("should have the correct name", () => {
        expect(command.name).toBe("list")
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Lists all queues.")
    })

    it("should have no options", () => {
        expect(command.options).toHaveLength(0)
    })

    it("should reply with all the queues", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!);
        const queues: FilterOutFunctionKeys<Queue>[] = [
            {
                name: "test",
                description: "test description",
                entries: new mongoose.Types.DocumentArray([]),
                info_channels: [],
                opening_times: new mongoose.Types.DocumentArray([]),
            },
            {
                name: "test2",
                description: "another description 2",
                entries: new mongoose.Types.DocumentArray([]),
                info_channels: [],
                opening_times: new mongoose.Types.DocumentArray([]),
            },
        ]
        dbGuild.queues = new mongoose.Types.DocumentArray(queues);
        await dbGuild.save();
        const replySpy = jest.spyOn(interaction, 'reply')
        await commandInstance.execute()

        expect(replySpy).toHaveBeenCalledTimes(1)
        expect(replySpy).toHaveBeenCalledWith({ 
            fetchReply: true,
             embeds: [{
                data: {
                    title: "Queue List",
                    description: "Here are all the queues available in this server.",
                    fields: [
                        {
                            name: "test",
                            value: "test description",
                        },
                        {
                            name: "test2",
                            value: "another description 2",
                        },
                    ],
                    color: Colors.Green,
                }
            }]
        });
    })
})
