import { BaseSubcommandsHandler } from "../baseCommand";
import QueueCommandsHandler from "./admin/QueueCommandsHandler";
import UpdateBotRolesCommand from "./admin/UpdateBotRoles";
import { Bot } from "../Bot";

export default class AdminCommandsHandler extends BaseSubcommandsHandler {
    public static name = "admin";
    public static description = "Admin command handler.";

    public static subcommands = [
        QueueCommandsHandler,
        UpdateBotRolesCommand
    ]
}