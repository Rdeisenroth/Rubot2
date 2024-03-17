import { BaseCommand } from "@baseCommand";
import { UserHasNoActiveSessionError, SessionHasNoQueueError, InteractionNotInGuildError, QueueListItem } from "@types";
import { ApplicationCommandOptionType, Colors, EmbedBuilder, GuildMember } from "discord.js";

export default class TutorQueueListCommand extends BaseCommand {
    public static name = "list";
    public static description = "Lists the first entries of the current queue.";
    public static options = [{
        name: "amount",
        description: "The amount of entries to list.",
        type: ApplicationCommandOptionType.Integer,
        required: false,
        default: 5,
    }];

    public async execute(): Promise<void> {
        try {
            const { queueName, entries, totalNumberOfEntries } = await this.getTutorQueueList();
            const embed = this.mountTutorQueueListEmbed(queueName, entries, totalNumberOfEntries);
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

    private mountTutorQueueListEmbed(queueName: string, entries: QueueListItem[], totalNumberOfEntries: number): EmbedBuilder {
        return new EmbedBuilder()
            .setTitle("Queue Information")
            .setDescription(`The queue ${queueName} has ${totalNumberOfEntries} ${totalNumberOfEntries == 1 ? "entry" : "entries"}.`)
            .addFields(entries.map((entry, index) => ({
                name: entry.member?.displayName ?? "Unknown",
                value:
                    `-Mention: ${entry.member ?? "Unknown"}\n-Position: ${index + 1}\n-Joined At: ${entry.joinedAt}${entry.intent ? `\n-Intent: ${entry.intent}` : ""}`,
            })))
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

    private async getTutorQueueList(): Promise<{ queueName: string, entries: QueueListItem[], totalNumberOfEntries: number }> {
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

        // Get the number of entries option
        const numberOfEntries = parseInt(this.getOptionValue(TutorQueueListCommand.options[0]));

        const queue = this.app.queueManager.getQueueById(dbGuild, session.queue);
        const entries = queue.getSortedEntries(numberOfEntries);
        const firstEntries = await Promise.all(entries.map(async (entry) => {
            let member: GuildMember | null;
            try {
                member = await this.interaction.guild!.members.fetch(entry.discord_id);
            } catch (error) {
                this.app.logger.info(`Member ${entry.discord_id} not found in guild ${this.interaction.guild!.id} but is in the queue ${queue.name}!`);
                member = null;
            }
            return {
                member: member,
                joinedAt: `<t:${Math.round((+entry.joinedAt) / 1000)}:f>`,
                intent: entry.intent
            }
        }));

        return {
            queueName: queue.name,
            entries: firstEntries,
            totalNumberOfEntries: queue.entries.length
        };
    }
}