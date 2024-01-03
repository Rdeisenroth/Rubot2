import { ApplicationCommandOptionData, ApplicationCommandOptionType, BaseChannel, ChatInputApplicationCommandData, Guild } from "discord.js";
import { Bot } from "../Bot";
import { delay, inject, injectable, singleton } from "tsyringe";
import { BaseCommand, BaseCommandOrSubcommandHandler, BaseSubcommandHandler } from "../baseCommand";

@injectable()
@singleton()
export default class CommandsManager {
    protected client: Bot;
    private commandsData: ChatInputApplicationCommandData[] = [];

    constructor(@inject(delay(() => Bot)) client: Bot) {
        this.client = client;
        this.commandsData = this.loadCommandsData(this.client.commands);
    }

    public async registerSlashCommandsFor(guild: Guild): Promise<void> {
        try {
            await guild.commands.set(this.commandsData);
            this.client.logger.info(`Registered commands in guild ${guild.name}`);
        } catch (error) {
            this.client.logger.error(`Failed to register commands in guild ${guild.name}`);
            throw error;
        }
    }

    private loadCommandsData(commands: typeof BaseCommandOrSubcommandHandler[]): ChatInputApplicationCommandData[] {
        const commandsData: ChatInputApplicationCommandData[] = [];

        for (const command of commands) {
            const commandData = this.loadCommandData(command);
            commandsData.push(commandData);
        }

        return commandsData;
    }

    private loadCommandData(command: typeof BaseCommandOrSubcommandHandler): ChatInputApplicationCommandData {
        if (command.prototype instanceof BaseCommand) {
            return this.loadBaseCommandData(command as typeof BaseCommand);
        } else if (command.prototype instanceof BaseSubcommandHandler) {
            return this.loadBaseSubcommandHandlerData(command as typeof BaseSubcommandHandler);
        }
        throw new Error(`Command ${command.name} is neither a BaseCommand nor a BaseSubcommandHandler.`);
    }

    private loadBaseCommandData(command: typeof BaseCommand): ChatInputApplicationCommandData {
        const commandData: ChatInputApplicationCommandData = {
            name: command.name,
            description: command.description,
            options: command.options as ApplicationCommandOptionData[],
        };
        return commandData;
    }

    private loadBaseSubcommandHandlerData(command: typeof BaseSubcommandHandler): ChatInputApplicationCommandData {
        const baseSubcommandHandler = command as typeof BaseSubcommandHandler;
        const subcommandsData = this.loadCommandsData(baseSubcommandHandler.subcommands);
        const subcommandOptions = subcommandsData.map(subcommandData => {
            const subcommandDataOptions = subcommandData.options!;
            const subcommandIsSubcommandHandler = subcommandDataOptions.flatMap(option => option.type).includes(ApplicationCommandOptionType.Subcommand);
            return {
                name: subcommandData.name,
                description: subcommandData.description,
                type: subcommandIsSubcommandHandler ? ApplicationCommandOptionType.SubcommandGroup : ApplicationCommandOptionType.Subcommand,
                options: subcommandData.options,
            }
        })
        const commandData: ChatInputApplicationCommandData = {
            name: command.name,
            description: command.description,
            options: subcommandOptions as ApplicationCommandOptionData[],
        }
        return commandData;
    }
}