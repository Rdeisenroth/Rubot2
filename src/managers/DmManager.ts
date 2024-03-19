import { Application } from "@application";
import { Queue } from "@models/Queue";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, User } from "discord.js";
import { delay, inject, injectable, singleton } from "tsyringe";
import { DocumentType } from "@typegoose/typegoose";

@injectable()
@singleton()
export default class DmManager {
    protected app: Application;

    constructor(@inject(delay(() => Application)) app: Application) {
        this.app = app;
    }

    private queueRefreshButton = new ButtonBuilder()
        .setCustomId("queue_refresh")
        .setLabel("Refresh")
        .setStyle(ButtonStyle.Primary);

    private queueStayButton = new ButtonBuilder()
        .setCustomId("queue_stay")
        .setLabel("Stay in Queue")
        .setStyle(ButtonStyle.Primary);

    private queueLeaveButton = new ButtonBuilder()
        .setCustomId("queue_leave")
        .setLabel("Leave Queue")
        .setStyle(ButtonStyle.Danger);


    public async sendQueueJoinMessage(user: User, queue: DocumentType<Queue>, joinMessage: string): Promise<void> {
        this.app.logger.debug(`Sending join message to user "${user.tag}" (id: ${user.id}) for queue "${queue.name}" (id: ${queue._id})`);
        const dmChannel = await user.createDM();

        const embed = new EmbedBuilder()
            .setTitle("Queue Update")
            .setDescription(joinMessage)

        const components = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                this.queueRefreshButton,
                this.queueLeaveButton
            )

        await dmChannel.send({ embeds: [embed], components: [components] });
    }

    public async sendQueueStayMessage(user: User, queue: DocumentType<Queue>): Promise<void> {
        this.app.logger.debug(`Sending stay message to user "${user.tag}" (id: ${user.id}) for queue "${queue.name}" (id: ${queue._id})`);
        const dmChannel = await user.createDM();

        const embed = new EmbedBuilder()
            .setTitle("Queue Update")
            .setDescription(`You stayed in the queue "${queue.name}"`)

        const components = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                this.queueRefreshButton,
                this.queueLeaveButton
            )

        await dmChannel.send({ embeds: [embed], components: [components] });
    }

    public async sendActuallyLeaveQueueMessage(user: User, queue: DocumentType<Queue>, leaveMessage: string): Promise<void> {
        this.app.logger.debug(`Sending actually want to leave queue message to user "${user.tag}" (id: ${user.id}) for queue "${queue.name}" (id: ${queue._id})`);
        const dmChannel = await user.createDM();

        const embed = new EmbedBuilder()
            .setTitle("Queue Update")
            .setDescription(leaveMessage)

        const components = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                this.queueStayButton,
                this.queueLeaveButton
            )

        await dmChannel.send({ embeds: [embed], components: [components] });
    }

    public async sendQueueLeaveMessage(user: User, queue: DocumentType<Queue>, leaveMessage: string): Promise<void> {
        this.app.logger.debug(`Sending leave message to user "${user.tag}" (id: ${user.id}) for queue "${queue.name}" (id: ${queue._id})`);
        const dmChannel = await user.createDM();

        const embed = new EmbedBuilder()
            .setTitle("Queue Update")
            .setDescription(leaveMessage)

        await dmChannel.send({ embeds: [embed] });
    }

    public async sendQueueLockedMessage(user: User, queue: DocumentType<Queue>): Promise<void> {
        this.app.logger.debug(`Sending lock message to user "${user.tag}" (id: ${user.id}) for queue "${queue.name}" (id: ${queue._id})`);
        const dmChannel = await user.createDM();

        const embed = new EmbedBuilder()
            .setTitle("Queue Update")
            .setDescription(`The queue "${queue.name}" is currently locked. You can't join it at the moment.`)

        await dmChannel.send({ embeds: [embed] });
    }

    public async sendErrorMessage(user: User, error: Error): Promise<void> {
        this.app.logger.debug(`Sending error message to user "${user.tag}" (id: ${user.id})`);
        const dmChannel = await user.createDM();

        const embed = new EmbedBuilder()
            .setTitle("Error")
            .setDescription(`An error occurred: ${error.message}`)

        await dmChannel.send({ embeds: [embed] });
    }
}