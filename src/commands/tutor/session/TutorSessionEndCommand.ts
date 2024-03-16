import { BaseCommand } from "@baseCommand";
import { Queue } from "@models/Queue";
import { Colors, EmbedBuilder } from "discord.js";
import { DocumentType } from "@typegoose/typegoose";
import { CouldNotFindQueueError, CouldNotFindQueueForSessionError, CouldNotFindRoleError, CouldNotRemoveRoleError, InteractionNotInGuildError, UserHasNoActiveSessionError } from "@types";
import { InternalRoles } from "@models/BotRoles";

/**
 * Represents a command to end a tutor session.
 */
export default class TutorSessionEndCommand extends BaseCommand {
    public static name = "end";
    public static description = "Ends a tutor session.";

    public async execute(): Promise<void> {
        await this.defer();
        try {
            const queue = await this.endTutorSession();
            const embed = this.mountEndTutorSessionEmbed(queue);
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

    /**
     * Mounts the embed for the end of the tutor session.
     * 
     * @param queue - The queue for the tutor session.
     * @returns The embed builder for the end of the tutor session.
     */
    private mountEndTutorSessionEmbed(queue: DocumentType<Queue>): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle("Tutor Session Ended")
            .setDescription(`You have ended the tutor session for queue "${queue.name}".`)
            .setColor(Colors.Green);
    }

    /**
     * Mounts the error embed for the tutor session end command.
     * 
     * @param error - The error object.
     * @returns The embed builder for the error.
     * @throws The error object if it is not an instance of the expected errors.
     */
    private mountErrorEmbed(error: Error): EmbedBuilder {
        if (error instanceof UserHasNoActiveSessionError || error instanceof CouldNotFindQueueForSessionError || error instanceof CouldNotFindQueueError || error instanceof CouldNotFindRoleError || error instanceof CouldNotRemoveRoleError) {
            return new EmbedBuilder()
                .setTitle("Error")
                .setDescription(error.message)
                .setColor(Colors.Red);
        }
        throw error;
    }

    /**
     * Ends the tutor session.
     * 
     * @returns The queue on which the tutor session was ended.
     * @throws {InteractionNotInGuildError} if the interaction is not in a guild.
     * @throws {UserHasNoActiveSessionError} if the user does not have an active session.
     * @throws {CouldNotFindQueueForSessionError} if the queue for the session could not be found.
     */
    private async endTutorSession(): Promise<DocumentType<Queue>> {
        if (!this.interaction.guild) {
            throw new InteractionNotInGuildError(this.interaction);
        }
        const dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild);
        const user = this.interaction.user;
        const dbUser = await this.app.userManager.getUser(user);
        const session = (await dbUser.getActiveSessions()).find(session => session.guild === dbGuild.id);

        // Check if the user has an active session
        if (!session) {
            throw new UserHasNoActiveSessionError();
        }

        // Get the queue
        if (!session.queue) {
            throw new CouldNotFindQueueForSessionError();
        }
        const queue = this.app.queueManager.getQueueById(dbGuild, session.queue._id);

        // remove active session role
        await this.app.userManager.removeRoleFromUser(dbGuild, this.interaction.user, InternalRoles.ACTIVE_SESSION);

        // end tutor session
        await this.app.queueManager.endTutorSession(queue, session, this.interaction.user);

        return queue;
    }
}
