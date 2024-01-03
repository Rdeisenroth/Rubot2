import { BaseSubcommandsHandler } from "../baseCommand";
import AdminQueueCommandsHandler from "./admin/AdminQueueCommandsHandler";
import UpdateBotRolesCommand from "./admin/UpdateBotRolesCommand";

export default class AdminCommandsHandler extends BaseSubcommandsHandler {
    public static name = "admin";
    public static description = "Admin command handler.";

    public static subcommands = [
        AdminQueueCommandsHandler,
        UpdateBotRolesCommand
    ]
}