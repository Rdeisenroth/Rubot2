import { BaseCommand } from "@baseCommand";
import { Guild } from "@models/Guild";
import { QueueEntry } from "@models/QueueEntry";
import { Session } from "@models/Session";
import { ChannelCouldNotBeCreatedError, InteractionNotInGuildError, QueueIsEmptyError, SessionHasNoQueueError, UserHasNoActiveSessionError } from "@types";
import { ApplicationCommandOptionType, EmbedBuilder, GuildMember, VoiceChannel } from "discord.js";
import { DocumentType } from "@typegoose/typegoose";
import { Queue } from "@models/Queue";

export default class TutorQueueNextCommand extends BaseCommand {
    public static name = "next";
    public static description = "Accepts the next student(s) in the queue.";
    public static options = [{
        name: "amount",
        description: "The amount of students to accept.",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        default: 1,
    }];

    /**
     * The guild saved in the database.
     */
    private dbGuild!: DocumentType<Guild>;

    /**
     * The queue saved in the database.
     */
    private dbQueue!: DocumentType<Queue>;

    /**
     * The session saved in the database.
     */
    private dbSession!: DocumentType<Session>;

    public async execute(): Promise<void> {
        try {
            const amount = parseInt(this.getOptionValue(TutorQueueNextCommand.options[0]));
            await this.loadGuildAndQueue();
            const tutor = this.interaction.member as GuildMember;
            const students = await this.selectNextStudents(amount);
            const nextRoomNumber = this.getNextRoomNumber();
            const tutoringVoiceChannel = await this.app.roomManager.createTutoringVoiceChannel(this.dbGuild, this.dbQueue, tutor, students, nextRoomNumber)
            // Reload the queue to avoid version errors
            await this.loadGuildAndQueue();
            await this.app.queueManager.notifyPickedStudents(this.dbQueue, students, tutor, tutoringVoiceChannel)
            await this.app.roomManager.moveMembersToRoom(students.concat(tutor), tutoringVoiceChannel, tutor, this.dbQueue)
            const embed = this.mountTutorQueueNextEmbed(students, tutoringVoiceChannel);
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

    private mountTutorQueueNextEmbed(students: GuildMember[], tutoringVoiceChannel: VoiceChannel): EmbedBuilder {
        const studentsString = students.join(", ");
        return new EmbedBuilder()
            .setTitle("Next Students")
            .setDescription(`Please join ${tutoringVoiceChannel} if you are not automatically moved.\nYour Participant${students.length > 1 ? "s" : ""}: ${studentsString}`);
    }

    private mountErrorEmbed(error: Error): EmbedBuilder {
        if (error instanceof UserHasNoActiveSessionError || error instanceof SessionHasNoQueueError || error instanceof QueueIsEmptyError || error instanceof ChannelCouldNotBeCreatedError) {
            return new EmbedBuilder()
                .setTitle("Error")
                .setDescription(error.message);
        }
        throw error;
    }

    private async loadGuildAndQueue(): Promise<void> {
        if (!this.interaction.guild) {
            throw new InteractionNotInGuildError(this.interaction);
        }

        this.dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild);
        const dbUser = await this.app.userManager.getUser(this.interaction.user);

        // Check if the user has an active session
        const dbSession = (await dbUser.getActiveSessions()).find(session => session.guild === this.dbGuild.id);
        if (!dbSession) {
            throw new UserHasNoActiveSessionError();
        }
        if (!dbSession.queue) {
            throw new SessionHasNoQueueError(this.dbSession);
        }

        // Get the queue
        const queueId = dbSession.queue;
        this.dbQueue = this.app.queueManager.getQueueById(this.dbGuild, queueId);
        this.dbSession = dbSession;
    }

    private async selectNextStudents(amount: number): Promise<GuildMember[]> {
        // Kick all students no longer on the server
        await this.app.queueManager.kickNonServerMembers(await this.interaction.guild!.members.fetch(), this.dbQueue);

        // Check if the queue is empty
        if (this.dbQueue.isEmpty()) {
            throw new QueueIsEmptyError(this.dbQueue);
        }

        // Select the next students
        const queueMembers = this.dbQueue.getSortedEntries(amount);

        // Get discord members
        return queueMembers.map(queueMember => this.interaction.guild!.members.resolve(queueMember.discord_id)!);
    }

    private getNextRoomNumber(): number {
        return this.dbSession.getNumberOfRooms() + 1;
    }
}