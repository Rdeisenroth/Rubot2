import mongoose from "mongoose";
import { EventDate } from "../../typings";
import { Event, eventType } from "./events";
import { UserModel } from "./users";
import { sessionRole } from "./sessions";
import { Snowflake, User } from "discord.js";
import { filterAsync } from "../utils/general";
import { ArraySubDocumentType, DocumentType, ReturnModelType, getModelForClass, prop } from "@typegoose/typegoose";

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
    @prop({ required: true, type: () => [Event], default: [] })
        events!: mongoose.Types.DocumentArray<ArraySubDocumentType<Event>>;

    /**
     * Collects All User IDs that joined The Channel at least Once
     */
    public async getUsers(this: DocumentType<Room>): Promise<string[]> {
        return (await RoomModel.aggregate<{ _id: string, count: number }>([
            { $match: { _id: this._id } },
            { $unwind: { path: "$events" } },
            { $match: { "events.type": { $in: [eventType.user_join, eventType.move_member] } } },
            { $group: { _id: { $cond: { if: { $eq: ["$events.type", eventType.user_join] }, then: "$events.emitted_by", else: { $ifNull: ["$events.target", "NULL"] } } }, count: { $sum: 1 } } },
            { $match: { _id: { $ne: "NULL" }, count: { $gt: 0 } } },
        ])).map(x => x._id);
    }

    /**
     * Gets The First Time someone Joins and Their Discord ID
     */
    public async getFirstJoinTimes(this: DocumentType<Room>): Promise<EventDate[]> {
        // We Assume that the Role Does not change During the Rooms Lifetime
        return (await RoomModel.aggregate<{ _id: string, timestamp: string }>([
            { $match: { _id: this._id } },
            { $unwind: { path: "$events" } },
            { $match: { "events.type": { $in: [eventType.user_join, eventType.move_member] } } },
            { $group: { _id: { $cond: { if: { $eq: ["$events.type", eventType.user_join] }, then: "$events.emitted_by", else: { $ifNull: ["$events.target", "NULL"] } } }, timestamp: { $min: "$events.timestamp" } } },
            { $match: { _id: { $ne: "NULL" } } },
        ])).map(x => { return { target_id: x._id, timestamp: x.timestamp } as EventDate; });
    }

    /**
     * Gets The Users with Their Roles at Join Date
     */
    public async getUserRoles(this: DocumentType<Room>): Promise<{
        userID: string;
        role: sessionRole | null;
    }[]> {
        const users = await this.getFirstJoinTimes();
        const userRoles: {
            userID: string;
            role: sessionRole | null;
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

    /**
     * Gets The Participants Of the Channel
     */
    public async getParticipants(this: DocumentType<Room>): Promise<string[]> {
        const roles = await this.getUserRoles();
        return roles.filter(x => x.role == sessionRole.participant || x.role == null).map(x => x.userID);
    }

    /**
     * Returns true if a given user has joined this channel at least once
     * @param user The User ID to check
     */
    public async wasVisitedBy(this: DocumentType<Room>, user: User | Snowflake): Promise<boolean> {
        if (user instanceof User) {
            user = user.id;
        }
        return (await this.getUsers()).includes(user);
    }

    /**
     * Returns true if a given user has joined this channel as a Participant at least once
     * @param user The User ID to check
     */
    public async wasParticipating(this: DocumentType<Room>, user: User | Snowflake): Promise<boolean> {
        if (user instanceof User) {
            user = user.id;
        }
        return (await this.getUserRoles()).some(x => x.userID === user && x.role != sessionRole.coach);
    }

    /**
     * Gets the Rooms a User visited
     */
    public static async getVisitedRooms(this: ReturnModelType<typeof Room>, user: User | Snowflake): Promise<Room[]> {
        if (user instanceof User) {
            user = user.id;
        }
        // return (await this.find()).filter(x => x.wasVisitedBy(user)).map(x => x.toObject<Room>());
        return this.find({
            events: {
                $elemMatch: {
                    $or: [
                        { type: eventType.user_join, emitted_by: user },
                        { type: eventType.move_member, target: user },
                    ],
                },
            },
        });
    }

    /**
     * Gets the Amount of Rooms a User visited
     */
    public static async getRoomCount(this: ReturnModelType<typeof Room>, user: User | Snowflake): Promise<number> {
        return (await RoomModel.getVisitedRooms(user)).length;
    }

    /**
     * Gets the Rooms a User participated in
     * @param user The User ID to check
     * @param rooms All Rooms
     */
    public static async getParticipantRooms(this: ReturnModelType<typeof Room>, user: User | Snowflake, rooms?: (DocumentType<Room> & { _id: string; })[]): Promise<Room[]> {
        if (user instanceof User) {
            user = user.id;
        }
        return (await filterAsync(rooms ?? await this.find(), async x => await x.wasParticipating(user))).map(x => x.toObject<Room>());
    }

    /**
     * Gets the Amount of Rooms a User participated in
     * @param user The User ID to check
     * @param rooms All Rooms
     */
    public static async getParticipantRoomCount(this: ReturnModelType<typeof Room>, user: User | Snowflake, rooms?: (DocumentType<Room> & { _id: string; })[]): Promise<number> {
        return (await this.getParticipantRooms(user, rooms)).length;
    }
}

export const RoomModel = getModelForClass(Room, {
    schemaOptions: {
        autoCreate: true,
    },
});