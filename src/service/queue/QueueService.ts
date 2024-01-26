import { Guild as GuildDB } from "../../models/guilds";
import { Guild} from "discord.js";
import { UserError } from "../error/UserError";
import { DocumentType } from "@typegoose/typegoose";
import { GuildModel } from "../../models/models";



export class QueueService {


    /**
     * sets the join Message of the given queue
     * @param g discord guild of the queue
     * @param queueName name of the queue
     * @param joinMessage join message to set
     */
    public static async setJoinMessage(g: Guild, queueName: string, joinMessage: string) {
        const guildData = await GuildModel.findById(g.id);
        if (!guildData) {
            throw new UserError("Guild Data Could not be found.");
        }

        const queueData = this.findQueueData(guildData, queueName)
        queueData.join_message = joinMessage

        await guildData.save()
    }

    /**
     * sets the leave Messag of the given queue
     * @param g discord guild of the queue
     * @param queueName name of the queue
     * @param leaveMessage leave message to set
     */
    public static async setLeaveMessage(g: Guild, queueName: string, leaveMessage: string) {
        const guildData = await GuildModel.findById(g.id);
        if (!guildData) {
            throw new UserError("Guild Data Could not be found.");
        }

        const queueData = this.findQueueData(guildData, queueName)
        queueData.leave_message = leaveMessage

        await guildData.save()
    }

    /**
     * finds the queue data for the given queue name
     * @param guildData the guild data to search in
     * @param queueName the name of the queue
     * @returns the queue data
     * @throws UserError if the queue data can not be found
     */
    public static findQueueData(guildData: DocumentType<GuildDB>, queueName: string) {
        const queueData = guildData.queues.find(x => x.name === queueName);
        if (!queueData) {
            throw new UserError("Could not find Queue.");
        }
        return queueData;
    }

}