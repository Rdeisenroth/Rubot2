import { BaseCommand } from "@baseCommand";
import { EmbedBuilder } from "discord.js";

export default class PingCommand extends BaseCommand {
    public static name = "ping";
    public static description = "Pong! Displays the api & bot latency.";
    public static options = [];

    public async execute(): Promise<void> {
        const res = await this.send("Pinging...");
        const messageTimestamp = res.createdTimestamp;
        const ping = messageTimestamp - this.interaction.createdTimestamp;

        const embed = this.mountPingEmbed(ping);
        await this.send({ content: "Pong.", embeds: [embed] });
    }

    /**
     * Returns the ping embed to be sent to the user.
     * @param ping The ping to be displayed.
     * @returns The embed to be sent to the user.
     */
    private mountPingEmbed(ping: number): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle("__Response Times__")
            .setColor(this.interaction.guild?.members.me?.roles?.highest.color || 0x7289da)
            .addFields({ name:"Bot Latency:", value:":hourglass_flowing_sand:" + ping + "ms", inline:true })
            .addFields({ name:"API Latency:", value:":hourglass_flowing_sand:" + Math.round(this.client.ws.ping) + "ms", inline:true })
        return embed
    }
}