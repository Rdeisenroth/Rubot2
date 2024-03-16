import { ArraySubDocumentType, mongoose, prop, DocumentType } from "@typegoose/typegoose";
import { VoiceChannelEvent, VoiceChannelEventType } from "./Event";
import { SessionRole } from "./Session";
import { EventDate } from "@types";
import { RoomModel, UserModel } from "./Models";

export class Room {
    /**
     * The Channel ID provided by Discord
     */
    @prop({ required: true })
    _id!: string;
    /**
     * If the Channel exists, it's active
     */
    @prop({ required: true })
    active!: boolean;
    /**
     * If Someone tampered with the Permissions/Name or Position of the Channel (or other Settings)
     */
    @prop({ required: true })
    tampered!: boolean;
    /**
     *  Only set to true if session had a clean exit
     */
    @prop({ required: true })
    end_certain!: boolean;
    /**
     * The Guild The Room is in
     */
    @prop({ required: true })
    guild!: string;
    /**
     * The Events that happen in the Channel
     */
    @prop({ required: true, type: () => [VoiceChannelEvent], default: [] })
    events!: mongoose.Types.DocumentArray<ArraySubDocumentType<VoiceChannelEvent>>;

    public async getFirstJoinTimes(this: DocumentType<Room>): Promise<EventDate[]> {
        // We Assume that the Role Does not change During the Rooms Lifetime
        return (await RoomModel.aggregate<{ _id: string, timestamp: string }>([
            { $match: { _id: this._id } },
            { $unwind: { path: "$events" } },
            { $match: { "events.type": { $in: [VoiceChannelEventType.user_join, VoiceChannelEventType.move_member] } } },
            { $group: { _id: { $cond: { if: { $eq: ["$events.type", VoiceChannelEventType.user_join] }, then: "$events.emitted_by", else: { $ifNull: ["$events.target", "NULL"] } } }, timestamp: { $min: "$events.timestamp" } } },
            { $match: { _id: { $ne: "NULL" } } },
        ])).map(x => { return { target_id: x._id, timestamp: x.timestamp } as EventDate; });
    }

    public async getUserRoles(this: DocumentType<Room>): Promise<{
        userID: string;
        role: SessionRole | null;
    }[]> {
        const users = await this.getFirstJoinTimes();
        const userRoles: {
            userID: string;
            role: SessionRole | null;
        }[] = [];
        for (const user of users) {
            const userModel = await UserModel.findById(user.target_id);
            if (!userModel) {
                userRoles.push({ userID: user.target_id, role: null });
                continue;
            }
            const role = await userModel.getRole(this.guild, (+user.timestamp));
            const b = {
                userID: user.target_id,
                role: role,
            };
            userRoles.push(b);
        }
        return userRoles;
    }

    public async getNumberOfParticipants(this: DocumentType<Room>): Promise<number> {
        const roles = await this.getUserRoles();
        return roles.filter(x => x.role === SessionRole.participant || x.role == null).length;
    }
}