import { BaseEvent } from "@baseEvent";
import { Application } from "@application";
import { delay, inject, singleton } from "tsyringe";
import Loader from "./Loader";

@singleton()
export default class EventsLoader extends Loader<(new (app: Application) => BaseEvent)> {
    /**
     * Creates a new `EventsLoader` instance.
     * @param app The main `Application` class.
     */
    constructor(@inject(delay(() => Application)) app: Application) {
        super(app)
    }

    protected fileNamePredicate(fileName: string): boolean {
        return fileName.endsWith("Event.ts");
    }

    protected isInstanceOfBaseClass(event: any): boolean {
        if (typeof event === "function" && event.prototype instanceof BaseEvent) {
            return true;
        }
        return false;
    }

    protected subfolderContentsTransformer(subfolder: string, subfolderContents: (new (app: Application) => BaseEvent)[]): (new (app: Application) => BaseEvent)[] {
        return subfolderContents;
    }
}