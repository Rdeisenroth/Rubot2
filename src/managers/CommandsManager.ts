import { ApplicationCommandOptionData, ChatInputApplicationCommandData, Guild } from "discord.js";
import { Bot } from "../Bot";
import { delay, inject, injectable, singleton } from "tsyringe";

@injectable()
@singleton()
export default class CommandsManager {
    protected client: Bot;
    private commandsData: ChatInputApplicationCommandData[] = [];

    constructor(@inject(delay(() => Bot)) client: Bot) {
        this.client = client;
        this.loadCommandsData();
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

    private loadCommandsData() {
        for (const command of this.client.commands) {
            const commandData: ChatInputApplicationCommandData = {
                name: command.name,
                description: command.description,
                options: command.options as ApplicationCommandOptionData[],
            };
            this.commandsData.push(commandData);
        }
    }
}