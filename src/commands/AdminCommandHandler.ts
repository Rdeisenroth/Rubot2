import { BaseSubcommandHandler } from "../baseCommand";
import QueueCommandHandler from "./admin/QueueCommandHandler";
import UpdateBotRolesCommand from "./admin/UpdateBotRoles";

export default class AdminCommandHandler extends BaseSubcommandHandler {
    public static name = "admin";
    public static description = "Admin command handler.";

    public static subcommands = [
        QueueCommandHandler,
        UpdateBotRolesCommand
    ]
}