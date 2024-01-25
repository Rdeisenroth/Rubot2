import { Application } from "@application";
import path from "path";
import fs from "fs";

export default abstract class Loader<T> {
    /**
     * The main `Application` class.
     */
    protected readonly app: Application

    /**
     * Creates a new `Loader` instance.
     * @param app The main `Application` class.
     */
    constructor(app: Application) {
        this.app = app;
    }

    /**
     * Loads the specified folder.
     * @param folder The folder to load.
     * @returns The contents of the specified folder.
     */
    public load(folder: string): T[] {
        const contents: T[] = [];

        const folderContents = fs.readdirSync(folder);
        const fileNames = folderContents.filter(this.fileNamePredicate);
        for (const fileName of fileNames) {
            const item = this.loadItem(folder, fileName);
            if (item) {
                contents.push(item);
            }
        }

        const subfolders = folderContents.filter(fileName => fs.lstatSync(path.join(folder, fileName)).isDirectory());
        for (const subfolder of subfolders) {
            const subfolderContents = this.loadSubfolder(folder, subfolder);
            contents.push(...subfolderContents);
        }

        return contents;
    }

    /**
     * Checks whether the specified file name is valid.
     * @param fileName The name of the file to check.
     * @returns Whether the specified file name is valid.
     */
    protected abstract fileNamePredicate(fileName: string): boolean;

    /**
     * Loads an item from the specified file.
     * @param folder The folder in which the item is located.
     * @param fileName The name of the file in which the item is located.
     * @returns The item if it was successfully loaded, `undefined` otherwise.
     */
    private loadItem(folder: string, fileName: string): T | undefined {
        const filePath = path.join(folder, fileName);
        const item = require(filePath).default
        if (!item) {
            this.app.logger.error(`Failed to load item from file "${filePath}"`);
            return undefined;
        } else if (!this.isInstanceOfBaseClass(item)) {
            this.app.logger.error(`Could not find a Base class in file "${filePath}"`);
            return undefined;
        }
        this.app.logger.debug(`Loaded item "${item.name}" from file "${filePath}"`);
        return item;
    }

    /**
     * Checks whether the specified item is an instance of a base class.
     * @param item The item to check.
     * @returns Whether the item is an instance of a base class.
     */
    protected abstract isInstanceOfBaseClass(item: any): boolean;

    /**
     * Loads the contents of the specified subfolder in the specified folder.
     * @param folder The folder in which the subfolder is located.
     * @param subfolder The name of the subfolder to load.
     * @returns The contents of the specified subfolder.
     */
    private loadSubfolder(folder: string, subfolder: string): T[] {
        const subfolderPath = path.join(folder, subfolder);
        const subfolderContents = this.load(subfolderPath);

        return this.subfolderContentsTransformer(subfolder, subfolderContents);
    }

    /**
     * Transforms the contents of the specified subfolder.
     * @param subfolder The name of the subfolder.
     * @param subfolderContents The contents of the subfolder.
     */
    protected abstract subfolderContentsTransformer(subfolder: string, subfolderContents: T[]): T[];
}