import { Application } from "@application"
import { BaseCommandOrSubcommandsHandler, BaseSubcommandsHandler } from "@baseCommand"
import { Interaction } from "discord.js"
import { BaseCommand } from "@baseCommand"
import { delay, inject, singleton } from "tsyringe"
import Loader from "./Loader"

/**
 * The `CommandsLoader` class.
 * Responsible for loading the bot commands.
 */
@singleton()
export default class CommandsLoader extends Loader<(new (interaction: Interaction, app: Application) => BaseCommandOrSubcommandsHandler)> {
    /**
     * Creates a new `CommandsLoader` instance.
     * @param app The main `Application` class.
     */
    constructor(@inject(delay(() => Application)) app: Application) {
        super(app)
    }

    protected fileNamePredicate(fileName: string): boolean {
        return fileName.endsWith('Command.ts')
    }

    protected isInstanceOfBaseClass(command: any): boolean {
        if (typeof command === 'function' && command.prototype instanceof BaseCommand) {
            return true
        }
        return false
    }

    protected subfolderContentsTransformer(subfolder: string, subfolderContents: (new (interaction: Interaction, app: Application) => BaseCommandOrSubcommandsHandler)[]): (new (interaction: Interaction, app: Application) => BaseCommandOrSubcommandsHandler)[] {
        const subcommandsHandler = class extends BaseSubcommandsHandler {
            public static name = subfolder
            public static description = `The ${subfolder} subcommands handler.`
            public static subcommands = subfolderContents
        }
        return [subcommandsHandler]
    }
    
}