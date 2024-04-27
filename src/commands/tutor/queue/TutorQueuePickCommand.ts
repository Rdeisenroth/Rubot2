import { BaseCommand } from "@baseCommand";
import { Queue } from "@models/Queue";
import { ApplicationCommandOptionType, Colors, EmbedBuilder, GuildMember, VoiceChannel } from "discord.js";
import { DocumentType } from "@typegoose/typegoose";
import { Session } from "@models/Session";
import { Guild } from "@models/Guild";
import { InteractionNotInGuildError, UserHasNoActiveSessionError, SessionHasNoQueueError, QueueIsEmptyError, NotInQueueError, ChannelCouldNotBeCreatedError } from "@types";

export default class TutorQueuePickCommand extends BaseCommand {
    public static name = "pick";
    public static description = "Picks a student from the queue.";
    public static options = [{
        name: "member",
        description: "The member of the queue to pick.",
        type: ApplicationCommandOptionType.User,
        required: true,
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
        await this.defer();
        try {
            await this.loadGuildAndQueue();
            const tutor = this.interaction.member as GuildMember;
            const studentId = this.getOptionValue(TutorQueuePickCommand.options[0]);
            const student = await this.getStudent(studentId);
            const nextRoomNumber = this.getNextRoomNumber();
            const tutoringVoiceChannel = await this.app.roomManager.createTutoringVoiceChannel(this.dbGuild, this.dbQueue, tutor, [student], nextRoomNumber);
            // Reload the queue to avoid version errors
            await this.loadGuildAndQueue();
            await this.app.queueManager.notifyPickedStudents(this.dbQueue, [student], tutor, tutoringVoiceChannel);
            await this.app.roomManager.moveMembersToRoom([student, tutor], tutoringVoiceChannel, tutor, this.dbQueue);
            const embed = this.mountTutorQueuePickEmbed(student, tutoringVoiceChannel);
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

    private mountTutorQueuePickEmbed(student: GuildMember, tutoringVoiceChannel: VoiceChannel): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setTitle("Student Picked")
            .setDescription(`You picked ${student} from the queue.\nPlease join ${tutoringVoiceChannel} if you are not automatically moved.`)
            .setColor(Colors.Green);
        return embed;
    }

    private mountErrorEmbed(error: Error): EmbedBuilder {
        if (error instanceof UserHasNoActiveSessionError || error instanceof SessionHasNoQueueError || error instanceof QueueIsEmptyError || error instanceof NotInQueueError || error instanceof ChannelCouldNotBeCreatedError) {
            return new EmbedBuilder()
                .setTitle("Error")
                .setDescription(error.message)
                .setColor(Colors.Red);
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

    private async getStudent(studentId: string): Promise<GuildMember> {
        // Kick all students no longer on the server
        await this.app.queueManager.kickNonServerMembers(await this.interaction.guild!.members.fetch(), this.dbQueue);

        // Check if the queue is empty
        if (this.dbQueue.isEmpty()) {
            throw new QueueIsEmptyError(this.dbQueue);
        }

        // Get the student
        if (!this.dbQueue.contains(studentId)) {
            throw new NotInQueueError(this.dbQueue.name, studentId);
        }

        // Select the student from the queue
        const queueMember = this.dbQueue.getEntry(studentId)!;

        // Get discord member
        return await this.interaction.guild!.members.fetch(queueMember.discord_id);
    }

    private getNextRoomNumber(): number {
        return this.dbSession.getNumberOfRooms() + 1;
    }
}