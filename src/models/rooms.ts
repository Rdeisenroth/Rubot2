import mongoose from "mongoose";
import { EventDate } from "../../typings";
import EventSchema, { Event, EventDocument, eventType } from "./events";
import UserSchema from "./users";
import { sessionRole } from "./sessions";
import { Channel } from "./text_channels";

export interface Room extends Channel {
    /**
     * The Channel ID provided by Discord
     */
    _id: string,
    /**
     * If the Channel exists, it's active
     */
    active: boolean,
    /**
     * If Someone tampered with the Permissions/Name or Position of the Channel (or other Settings)
     */
    tampered: boolean,
    /**
     *  Only set to true if session had a clean exit
     */
    end_certain: boolean,
    /**
     * The Guild The Room is in
     */
    guild: string,
    /**
     * The Events that happen in the Channel
     */
    events: Event[],
}

const RoomSchema = new mongoose.Schema<RoomDocument, RoomModel, Room>({
    _id: {
        type: String,
        required: true,
    },
    active: {
        type: Boolean,
        required: true,
    },
    tampered: {
        type: Boolean,
        required: true,
    },
    end_certain: {
        type: Boolean,
        required: true,
    },
    guild: {
        type: String,
        required: true,
    },
    events: [{
        type: EventSchema,
        required: true,
        default: [],
    }],
});

export interface RoomDocument extends Room, Omit<mongoose.Document, "_id"> {
    events: mongoose.Types.DocumentArray<EventDocument>,
    /**
     * Collects All User IDs that joined The Channel at least Once
     */
    getUsers(): string[],
    /**
     * Gets The First Time someone Joins and Their Discord ID
     */
    getFirstJoinTimes(): EventDate[],
    /**
     * Gets The Users with Their Roles at Join Date
     */
    getUserRoles(): Promise<{
        userID: string;
        role: sessionRole | null;
    }[]>,
    /**
     * Gets The Participants Of the Channel
     */
    getParticipants(): Promise<string[]>
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RoomModel extends mongoose.Model<RoomDocument> {

}

// --Methods--

RoomSchema.method("getUsers", function () {
    return [... new Set(this.events.filter(x => [eventType.user_join, eventType.move_member].includes(x.type)).map(x => x.type === eventType.user_join ? x.emitted_by : x.target!))];
});
RoomSchema.method("getUserRoles", async function () {
    const users = this.getFirstJoinTimes();
    const userRoles: {
        userID: string;
        role: sessionRole | null;
    }[] = [];
    for(const user of users){
        const userSchema = await UserSchema.findById(user.target_id);
        if (!userSchema) {
            userRoles.push( { userID: user.target_id, role: null });
            continue;
        }
        const role = await userSchema.getRole(this.guild, (+user.timestamp));
        const b = {
            userID: user.target_id,
            role: role,
        };
        userRoles.push(b);
    }
    return userRoles;

    // Why the fuck does the below Code not Work??? Literally the Same >:(

    // let userRoles = users.map(async (x) => {
    //     let userSchema = await UserSchema.findById(x.target_id);
    //     if(!userSchema) return { userID: x.target_id, role: null};
    //     let role = await userSchema.getRole(this.guild, (+x.timestamp));
    //     let b =  {
    //         userID: x.target_id,
    //         role: role,
    //     }
    //     return b;
    // });
    // let a = await userRoles;
});

RoomSchema.method("getParticipants", async function () {
    const roles = await this.getUserRoles();
    return roles.filter(x => x.role == sessionRole.participant || x.role == null).map(x=> x.userID);
});

RoomSchema.method("getFirstJoinTimes", function () {
    // We Assume that the Role Does not change During the Rooms Lifetime
    const eventDates = this.events.filter(x => [eventType.user_join, eventType.move_member].includes(x.type)).map(x => { return { timestamp: x.timestamp, target_id: (x.type === eventType.user_join ? x.emitted_by : x.target!), event_id: (x as EventDocument)._id } as EventDate; });
    return eventDates.filter((x, pos) => eventDates.findIndex(y => y.target_id === x.target_id) === pos);
});

// Default export
export default mongoose.model<RoomDocument, RoomModel>("Rooms", RoomSchema);