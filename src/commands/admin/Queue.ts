import { BaseSubcommandHandler } from "../../baseCommand";
import HelpCommand from "../Help";
import UpdateBotRolesCommand from "./UpdateBotRoles";

export default class QueueCommandHandler extends BaseSubcommandHandler {
    public static name = "queue";
    public static description = "Queue command handler.";

    public static subcommands = [
    ]
}