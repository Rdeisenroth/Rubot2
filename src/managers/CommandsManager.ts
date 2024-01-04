import { ApplicationCommandOptionData, ApplicationCommandOptionType, BaseChannel, ChatInputApplicationCommandData, Guild } from "discord.js";
import { delay, inject, injectable, singleton } from "tsyringe";
import { BaseCommand, BaseCommandOrSubcommandsHandler, BaseSubcommandsHandler } from "../baseCommand";
import { Application } from "@application";

@injectable()
@singleton()
export default class CommandsManager {
    protected app: Application;
    private commandsData: ChatInputApplicationCommandData[] = [];

    constructor(@inject(delay(() => Application)) app: Application) {
        this.app = app;
        this.commandsData = this.loadCommandsData(this.app.commands);
    }

    public async registerSlashCommandsFor(guild: Guild): Promise<void> {
        try {
            await guild.commands.set(this.commandsData);
            this.app.logger.info(`Registered commands in guild "${guild.name}" (id: ${guild.id})`);
        } catch (error) {
            this.app.logger.error(`Failed to register commands in guild "${guild.name}" (id: ${guild.id})`);
            throw error;
        }
    }

    private loadCommandsData(commands: typeof BaseCommandOrSubcommandsHandler[]): ChatInputApplicationCommandData[] {
        const commandsData: ChatInputApplicationCommandData[] = [];

        for (const command of commands) {
            const commandData = this.loadCommandData(command);
            commandsData.push(commandData);
        }

        return commandsData;
    }

    private loadCommandData(command: typeof BaseCommandOrSubcommandsHandler): ChatInputApplicationCommandData {
        if (command.prototype instanceof BaseCommand) {
            return this.loadBaseCommandData(command as typeof BaseCommand);
        } else if (command.prototype instanceof BaseSubcommandsHandler) {
            return this.loadBaseSubcommandsHandlerData(command as typeof BaseSubcommandsHandler);
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

    private loadBaseSubcommandsHandlerData(command: typeof BaseSubcommandsHandler): ChatInputApplicationCommandData {
        const baseSubcommandsHandler = command as typeof BaseSubcommandsHandler;
        const subcommandTypes: typeof BaseCommandOrSubcommandsHandler[] = baseSubcommandsHandler.subcommands.map(subcommand => subcommand.prototype.constructor)
        const subcommandsData = this.loadCommandsData(subcommandTypes);
        const subcommandOptions = subcommandsData.map(subcommandData => {
            const subcommandDataOptions = subcommandData.options!;
            const subcommandIsSubcommandsHandler = subcommandDataOptions.flatMap(option => option.type).includes(ApplicationCommandOptionType.Subcommand);
            return {
                name: subcommandData.name,
                description: subcommandData.description,
                type: subcommandIsSubcommandsHandler ? ApplicationCommandOptionType.SubcommandGroup : ApplicationCommandOptionType.Subcommand,
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