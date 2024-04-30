import { BaseCommand } from "@baseCommand";
import { SessionModel } from "@models/Models";
import { Session } from "@models/Session";
import { EmbedBuilder, Colors } from "discord.js";
import { DocumentType } from "@typegoose/typegoose";
import { Guild } from "@models/Guild";

export default class AdminSessionListCommand extends BaseCommand {
    public static name = "list";
    public static description = "Lists all active sessions.";
    public static options = [];

    /**
     * The Guild from the Database
     */
    private dbGuild!: DocumentType<Guild>;

    public async execute(): Promise<void> {
        await this.defer();
        this.dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild!);
        const sessions = await this.getSortedSessions();
        const embed = await this.mountSessionListEmbed(sessions);
        await this.send({ embeds: [embed] });
    }

    private async mountSessionListEmbed(sessions: DocumentType<Session>[]): Promise<EmbedBuilder> {
        const fields = await Promise.all(sessions.map(async session => {
            const member = await this.interaction.guild?.members.fetch(session.user)!;
            const participants = await session.getNumberOfParticipants();
            const rooms = session.getNumberOfRooms();
            const queue = this.dbGuild.queues.id(session.queue);
            return {
                name: member.displayName,
                value: `- started at: <t:${Math.round((+session.started_at!) / 1000)}:f>\n` +
                `- rooms: ${rooms}\n` +
                `- participants: ${participants}\n` +
                `- queue: ${queue?.name ?? "Unknown"}`,
                inline: false
            }
        }))
        const embed = new EmbedBuilder()
            .setTitle("Active Sessions")
            .setDescription(`There ${sessions.length === 1 ? "is" : "are"} currently ${sessions.length} active session${sessions.length === 1 ? "" : "s"}.`)
            .addFields(fields)
            .setColor(Colors.Green);
        return embed;
    }

    private async getSortedSessions(): Promise<DocumentType<Session>[]> {
        const sessions = await SessionModel.find({ guild: this.dbGuild.id, active: true });
        const sortedSessions = sessions.sort((a, b) => (+a.started_at!) - (+b.started_at!));
        return sortedSessions;
    }
}