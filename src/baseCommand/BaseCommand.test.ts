import { MockDiscord } from "@tests/mockDiscord";
import { ApplicationCommandOptionType, Channel, ChatInputCommandInteraction, CommandInteraction, TextChannel } from "discord.js";
import BaseCommand from "./BaseCommand";
import { MissingOptionError, OptionRequirement } from "@types";

describe("BaseCommand", () => {
    describe.each([ApplicationCommandOptionType.String, ApplicationCommandOptionType.Integer, ApplicationCommandOptionType.Boolean, ApplicationCommandOptionType.Channel])("getOptionValue with type %p", (optionType) => {
        const discord = new MockDiscord();
        let commandInstance: BaseCommand;
        let interaction: ChatInputCommandInteraction;
        let option: OptionRequirement;
        let value: string | number | boolean;

        beforeEach(() => {
            interaction = discord.mockInteraction();
            commandInstance = new class extends BaseCommand {
                public static name = "test";
                public static description = "test";

                public execute(): Promise<void> {
                    throw new Error("Method not implemented.");
                }
            }(interaction, discord.getApplication());

            option = { name: "testOption", description: "do not expect this", type: optionType, required: true };

            if (optionType === ApplicationCommandOptionType.String) {
                value = "testValue";
            } else if (optionType === ApplicationCommandOptionType.Integer) {
                value = 5;
            } else if (optionType === ApplicationCommandOptionType.Boolean) {
                value = true;
            } else if (optionType === ApplicationCommandOptionType.Channel) {
                value = discord.mockChannel().id;
            } else {
                throw new Error("Invalid option type");
            }
        });

        it.each([true, false])("should return the option value if it exists (option is required: %p)", (required) => {
            option.required = required;
            interaction.options.get = jest.fn().mockImplementation((optionName: string) => {
                return { value: value };
            })

            let res = (commandInstance as any).getOptionValue(option) as string;
            expect(res).toBe(value);
        })

        it.each([true, false])("should return the default value if option does not exist (option is required: %p)", (required) => {
            option.required = required;
            option.default = value;
            interaction.options.get = jest.fn().mockImplementation((optionName: string) => {
                return null;
            })

            let res = (commandInstance as any).getOptionValue(option) as string;
            expect(res).toBe(value);
        })

        it("should throw MissingOptionError if required option does not exist", () => {
            option.required = true;
            interaction.options.get = jest.fn().mockImplementation((optionName: string) => {
                return null;
            })

            expect(() => (commandInstance as any).getOptionValue(option)).toThrow(MissingOptionError);
        })

        it("should return an empty string if option does not exist and no default value is provided", () => {
            option.required = false;
            interaction.options.get = jest.fn().mockImplementation((optionName: string) => {
                return null;
            })

            let res = (commandInstance as any).getOptionValue(option) as string;
            expect(res).toBe("");
        })
    });
});