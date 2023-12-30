import { BaseCommand } from "../baseCommand";
import { EmbedBuilder } from "discord.js";

export default class HelpCommand extends BaseCommand {
    public static name = "help";
    public static description = "Get help with the bot";
    public static options = [];

    public async execute() {
        const embed = new EmbedBuilder()
            .setTitle("Help")
            .setDescription("This is a help command")
            .setColor("#FF0000")

        await this.send({ embeds: [embed] });
    }
}