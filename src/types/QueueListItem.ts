import { GuildMember } from "discord.js";

export type QueueListItem = {
    member: GuildMember | null;
    joinedAt: string;
    intent?: string;
};