import { BaseSubcommandsHandler } from "../../baseCommand";
import CreateQueueCommand from "./queue/CreateQueueCommand";

export default class ConfigQueueCommandsHandler extends BaseSubcommandsHandler {
    public static name = "queue";
    public static description = "Config queue command handler.";

    public static subcommands = [
        CreateQueueCommand,
    ]
}