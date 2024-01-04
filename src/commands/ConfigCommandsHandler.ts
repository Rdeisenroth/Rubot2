import { BaseSubcommandsHandler } from "@baseCommand";
import ConfigQueueCommandsHandler from "./config/ConfigQueueCommandsHandler";

export default class ConfigCommandsHandler extends BaseSubcommandsHandler {
    public static name = "config";
    public static description = "Config command handler.";

    public static subcommands = [
        ConfigQueueCommandsHandler,
    ]
}