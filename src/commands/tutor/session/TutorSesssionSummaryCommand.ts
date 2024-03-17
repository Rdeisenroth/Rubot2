import { BaseCommand } from "@baseCommand";
import { InteractionNotInGuildError, UserHasNoActiveSessionError } from "@types";
import { EmbedBuilder, Colors } from "discord.js";
import { DocumentType } from "@typegoose/typegoose";
import { Session } from "@models/Session";
import { formatDuration } from "@utils/formatDuration";

export default class TutorSessionSummaryCommand extends BaseCommand {
    public static name = "summary";
    public static description = "Shows a summary of the current session.";

    public async execute(): Promise<void> {
        try {
            const { timeSpent, channelsVisited, participants } = await this.getTutorSessionSummary();
            const embed = this.mountTutorSessionSummaryEmbed(timeSpent, channelsVisited, participants);
            await this.send({ embeds: [embed] });
        } catch (error) {
            if (error instanceof Error) {
                const embed = this.mountErrorEmbed(error);
                await this.send({ embeds: [embed] });
            } else {
                throw error;
            }
        }
    }

    private mountTutorSessionSummaryEmbed(timeSpent: string, channelsVisited: number, participants: number): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle("Session Summary")
            .addFields({
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
            })
            .setColor(Colors.Green);
    }

    private mountErrorEmbed(error: Error): EmbedBuilder {
        if (error instanceof UserHasNoActiveSessionError) {
            return new EmbedBuilder()
                .setTitle("Error")
                .setDescription(error.message)
                .setColor(Colors.Red);
        }
        throw error;
    }

    private async getTutorSessionSummary(): Promise<{timeSpent: string, channelsVisited: number, participants: number}> {
        if (!this.interaction.guild) {
            throw new InteractionNotInGuildError(this.interaction);
        }
        const dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild);
        const dbUser = await this.app.userManager.getUser(this.interaction.user);
        const session = (await dbUser.getActiveSessions()).find(session => session.guild === dbGuild.id);

        // Check if the user has an active session
        if (!session) {
            this.app.logger.error(`User ${this.interaction.user.displayName} (id: ${this.interaction.user.id}) has no active session.`);
            throw new UserHasNoActiveSessionError();
        }

        const timeSpent = this.getTimeSpent(session);
        const channelsVisited = session.rooms.length;
        const participants = await session.getNumberOfParticipants();

        return { timeSpent, channelsVisited, participants };
    }

    private getTimeSpent(session: DocumentType<Session>): string {
        const start = session.started_at!;
        const diff = Date.now() - (+start);
        return formatDuration(diff);
    }
}