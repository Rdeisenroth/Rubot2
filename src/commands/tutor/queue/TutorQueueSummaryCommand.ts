import { BaseCommand } from "@baseCommand";
import { SessionModel } from "@models/Models";
import { InteractionNotInGuildError, SessionHasNoQueueError, UserHasNoActiveSessionError } from "@types";
import { EmbedBuilder, Colors } from "discord.js";

export default class TutorQueueSummaryCommand extends BaseCommand {
    public static name = "summary";
    public static description = "Shows a summary of the current queue.";

    public async execute(): Promise<void> {
        try {
            const { name, description, entries, tutorSessions } = await this.getTutorQueueSummary();
            const embed = this.mountTutorQueueSummaryEmbed(name, description, entries, tutorSessions);
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

    private mountTutorQueueSummaryEmbed(name: string, description: string, entries: number, tutorSessions: number): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle("Queue Summary")
            .addFields({
                name: "Name",
                value: name,
            }, {
                name: "Description",
                value: description,
            }, {
                name: "Entries",
                value: entries.toString(),
                inline: true
            }, {
                name: "Tutor Sessions",
                value: tutorSessions.toString(),
                inline: true
            })
            .setColor(Colors.Green);
    }

    private mountErrorEmbed(error: Error): EmbedBuilder {
        if (error instanceof UserHasNoActiveSessionError || error instanceof SessionHasNoQueueError) {
            return new EmbedBuilder()
                .setTitle("Error")
                .setDescription(error.message)
                .setColor(Colors.Red);
        }
        throw error;
    }

    private async getTutorQueueSummary(): Promise<{name: string, description: string, entries: number, tutorSessions: number}> {
        if (!this.interaction.guild) {
            throw new InteractionNotInGuildError(this.interaction);
        }
        const dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild);
        const dbUser = await this.app.userManager.getUser(this.interaction.user);
        const session = (await dbUser.getActiveSessions()).find(session => session.guild === dbGuild.id);

        // Check if the user has an active session
        if (!session) {
            this.app.logger.info(`User ${this.interaction.user.displayName} (id: ${this.interaction.user.id}) has no active session.`);
            throw new UserHasNoActiveSessionError();
        } else if (!session.queue) {
            this.app.logger.info(`Session ${session.id} has no queue.`);
            throw new SessionHasNoQueueError(session);
        }

        const queue = this.app.queueManager.getQueueById(dbGuild, session.queue);
        const numberOfQueueSessions = await SessionModel.find({ queue: queue._id, active: true }).countDocuments();

        return {
            name: queue.name,
            description: queue.description ?? "No description",
            entries: queue.entries.length,
            tutorSessions: numberOfQueueSessions
        };
    }
}