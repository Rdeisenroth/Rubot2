import { BaseCommand } from "@baseCommand";
import { InteractionNotInGuildError } from "@types";
import { formatDuration } from "@utils/formatDuration";
import { EmbedBuilder, Colors } from "discord.js";
import { DocumentType } from "@typegoose/typegoose";
import { Session } from "@models/Session";

export default class TutorSummaryCommand extends BaseCommand {
    public static name = "summary";
    public static description = "Shows a summary of all your Sessions.";

    public async execute(): Promise<void> {
        const { numberOfSessions, timeSpent, channelsVisited, participants } = await this.getTutorSummary();
        const embed = this.mountTutorSummaryEmbed(numberOfSessions, timeSpent, channelsVisited, participants);
        await this.send({ embeds: [embed] });
    }

    private mountTutorSummaryEmbed(numberOfSessions: number, timeSpent?: string, channelsVisited?: number, participants?: number): EmbedBuilder {
        var embed = new EmbedBuilder()
            .setTitle("Summary")
            .setDescription(`You had ${numberOfSessions} ${numberOfSessions === 1 ? "session" : "sessions"}.`)
            .setColor(Colors.Green);

        if (timeSpent !== undefined && channelsVisited !== undefined && participants !== undefined) {
            embed = embed.addFields({
                name: "Time Spent",
                value: timeSpent,
            }, {
                name: "Channels Visited",
                value: channelsVisited.toString(),
                inline: true
            }, {
                name: "Participants",
                value: participants.toString(),
                inline: true
            });
        }

        return embed;
    }

    private async getTutorSummary(): Promise<{ numberOfSessions: number, timeSpent?: string, channelsVisited?: number, participants?: number }> {
        if (!this.interaction.guild) {
            throw new InteractionNotInGuildError(this.interaction);
        }
        const dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild);
        const dbUser = await this.app.userManager.getUser(this.interaction.user);

        const sessions = await dbUser.getSessions(dbGuild._id);
        const numberOfSessions = sessions.length;

        if (numberOfSessions === 0) {
            this.app.logger.info(`No sessions found for user ${this.interaction.user.displayName} (id: ${this.interaction.user.id}) in guild ${dbGuild.name} (id: ${dbGuild.id})`)
            return { numberOfSessions };
        }

        let timeSpent = 0;
        let channelsVisited = 0;
        let participants = 0;

        for (const session of sessions) {
            timeSpent += this.getTimeSpent(session);
            channelsVisited += session.getNumberOfRooms();
            participants += await session.getNumberOfParticipants();
        }

        return {
            numberOfSessions,
            timeSpent: formatDuration(timeSpent),
            channelsVisited,
            participants
        };

    }

    private getTimeSpent(session: DocumentType<Session>): number {
        const start = session.started_at!;
        const end = session.ended_at ?? Date.now();
        const diff = (+end) - (+start);
        return diff
    }
}