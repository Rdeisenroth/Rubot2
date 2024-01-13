import { Application } from "@application"
import { BaseCommandOrSubcommandsHandler, BaseSubcommandsHandler } from "@baseCommand"
import { Interaction } from "discord.js"
import { BaseCommand } from "@baseCommand"
import fs from "fs"
import path from "path"
import { delay, inject, singleton } from "tsyringe"

/**
 * The `CommandsLoader` class.
 * Responsible for loading the bot commands.
 */
@singleton()
export default class CommandsLoader {
    /**
     * The main `Application` class.
     */
    private readonly app: Application

    /**
     * Creates a new `CommandsLoader` instance.
     * @param app The main `Application` class.
     */
    constructor(@inject(delay(() => Application)) app: Application) {
        this.app = app
    }

    /**
     * Loads the bot commands from the specified folder.
     * @param commandsFolder The folder where the bot commands are located.
     * @returns The bot commands in the specified folder.
     */
    public loadCommands(commandsFolder: string): (new (interaction: Interaction, app: Application) => BaseCommandOrSubcommandsHandler)[] {
        const commands: (new (interaction: Interaction, app: Application) => BaseCommandOrSubcommandsHandler)[] = []
        
        const folderContents = fs.readdirSync(commandsFolder)
        const commandFileNames = folderContents.filter(fileName => fileName.endsWith("Command.ts"))
        for (const commandFileName of commandFileNames) {
            const command = this.loadCommand(commandsFolder, commandFileName)
            if (command) {
                commands.push(command)
            }
        }

        const subfolders = folderContents.filter(fileName => fs.lstatSync(path.join(commandsFolder, fileName)).isDirectory())
        for (const subfolder of subfolders) {
            commands.push(this.loadSubcommands(commandsFolder, subfolder))
        }

        return commands
    }

    /**
     * Loads a bot command from the specified file.
     * @param commandsFolder The folder where the bot commands are located.
     * @param commandFileName The name of the command file.
     * @returns The command class if it was successfully loaded, `undefined` otherwise.
     */
    private loadCommand(commandsFolder: string, commandFileName: string): (new (interaction: Interaction, app: Application) => BaseCommandOrSubcommandsHandler) | undefined {
        const commandFilePath = path.join(commandsFolder, commandFileName)
        const commandFileObj = require(commandFilePath)
        const command = commandFileObj.default
        if (this.hasBaseCommandClass(commandFilePath)) {
            this.app.logger.info(`Successfully loaded command ${commandFileName}`)
            return command
        } else {
            this.app.logger.error(`Could not find a BaseCommand class in command ${commandFileName}`)
            
        }
    }

    /**
     * Loads the subcommands in the specified subfolder and returns a subcommands handler class for them.
     * @param commandsFolder The folder where the bot commands are located.
     * @param subfolder The name of the subfolder containing the subcommands.
     * @returns A subcommands handler class for the commands in the specified subfolder.
     */
    private loadSubcommands(commandsFolder: string, subfolder: string): (new (interaction: Interaction, app: Application) => BaseCommandOrSubcommandsHandler) {
        const subfolderPath = path.join(commandsFolder, subfolder)
        const subfolderCommands = this.loadCommands(subfolderPath)

        const subcommandsHandler = class extends BaseSubcommandsHandler {
            public static name = subfolder
            public static description = `The ${subfolder} subcommands handler.`
            public static subcommands = subfolderCommands
        }
        return subcommandsHandler
    }

    /**
     * Checks if the specified file contains a class that extends `BaseCommand`.
     * @param filePath The path of the file to check.
     * @returns Whether the file contains a class that extends `BaseCommand`.
     */
    private hasBaseCommandClass(filePath: string): boolean {
        const file = require(filePath)
        const classNames = Object.keys(file)
        for (const className of classNames) {
            const classObj = file[className]
            if (typeof classObj === 'function' && classObj.prototype instanceof BaseCommand) {
                return true
            }
        }
        return false
    }
    
}