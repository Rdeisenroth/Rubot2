import { SubDocumentType } from "@typegoose/typegoose";
/* eslint-disable @typescript-eslint/no-empty-interface */
import { Channel } from "./text_channels";
import { VoiceChannelSpawner } from "./voice_channel_spawner";
import * as djs from "discord.js";
import { DocumentType, Ref, prop, mongoose } from "@typegoose/typegoose";
import { Queue } from "./queues";

export class VoiceChannel implements Channel {
    @prop({ required: true })
        _id!: string;
    @prop({ required: true, type: Number, enum: [0, 1, 2, 3, 4, 5, 6, 7] })
        channel_type!: djs.ChannelType;
    @prop({ required: true })
        managed!: boolean;
    @prop()
        category?: string | undefined;
    @prop()
        owner?: string | undefined;
    /**
     * If the channel is an AFK-Hell (constantly plays a Song)
     */
    @prop({ default: false })
        afkhell?: boolean;
    /**
     * The Song Link for AFK Hell
     */
    @prop()
        song_link?: string;
    /**
     * If the voice Channel is locked to a specific user group (used to keep track of lock icon)
     */
    @prop({ required: true, default: false })
        locked!: boolean;
    /**
     * The Permitted Users/Roles that can enter this channel
     */
    @prop({ required: true, type: String, default: [] })
        permitted!: mongoose.Types.Array<string>;
    /**
     * Makes the Channel a spawner Channel which creates a new channel for every joined member
     */
    @prop({ required: false, type: () => VoiceChannelSpawner })
        spawner?: SubDocumentType<VoiceChannelSpawner>;
    /**
     * The Channel Prefix
     */
    @prop()
        prefix?: string;
    /**
     * A Queue that is entered with joining this Channel
     */
    @prop({ ref: () => Queue })
        queue?: Ref<Queue>;
    /**
     * If the VC is a Temporary Voice Channel
     */
    @prop({ default: false })
        temporary?: boolean;
    /**
     * The Channel Supervisor Roles/ User IDs
     */
    @prop({ type: String, default: [] })
        supervisors?: mongoose.Types.Array<string>;

    /**
     * Locks the Voice Channel
     * @param channel The Channel to lock
     * @param roleId The @everyone Role ID
     */
    public async lock(this: DocumentType<VoiceChannel>, channel: djs.VoiceChannel, roleId?: string | undefined): Promise<void> {
        this.locked = true;
        await this.$parent()?.save();
        await this.syncPermissions(channel, roleId);
    }

    /**
     * Unlocks the Voice Channel
     * @param channel The Channel to unlock
     * @param roleId The @everyone Role ID
     */
    public async unlock(this: DocumentType<VoiceChannel>, channel: djs.VoiceChannel, roleId?: string | undefined): Promise<void> {
        this.locked = false;
        await this.$parent()?.save();
        await this.syncPermissions(channel, roleId);
    }

    /**
     * Locks or Unlocks the Voice Channel (opposite State).
     * @param channel The Channel to toggle
     * @param roleId The @everyone Role ID
     */
    public async toggleLock(this: DocumentType<VoiceChannel>, channel: djs.VoiceChannel, roleId?: string | undefined): Promise<void> {
        this.locked ? await this.lock(channel, roleId) : await this.unlock(channel, roleId);
        await this.$parent()?.save();
    }

    /**
     * Sync The VC-Permissions with the Database
     * @param channel The Channel to Sync
     * @param roleId The @everyone Role ID
     * @returns true, if changes occured
     */
    public async syncPermissions(this: DocumentType<VoiceChannel>, channel: djs.VoiceChannel, roleId?: string | undefined, lockOverwrite?: boolean): Promise<boolean> {
        lockOverwrite = lockOverwrite ?? this.locked;
        const actual_permissions = channel.permissionOverwrites.cache.get(roleId ?? channel.guild.roles.everyone.id);
        if (!actual_permissions
            || (lockOverwrite && !(actual_permissions.allow.has("ViewChannel") && actual_permissions.deny.has("Connect")))
            || (!lockOverwrite && !(actual_permissions.allow.has("ViewChannel") && actual_permissions.allow.has("Connect")))
            || (!this.queue && !actual_permissions.allow.has("Speak"))
            || (this.queue && !actual_permissions.deny.has("Speak"))
        ) {
            // Update roles
            await channel.permissionOverwrites.edit(roleId ?? channel.guild.roles.everyone.id, { "ViewChannel": true, "Connect": !lockOverwrite, "Speak": !this.queue });
            return true;
        } else {
            return false;
        }
    }
}