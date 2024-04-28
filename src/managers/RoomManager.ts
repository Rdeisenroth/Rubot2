import { Application } from "@application"
import { Guild } from "@models/Guild";
import { Queue } from "@models/Queue";
import { VoiceChannel as DatabaseVoiceChannel } from "@models/VoiceChannel";
import { VoiceChannelSpawner } from "@models/VoiceChannelSpawner";
import { ChannelType, Guild as DiscordGuild, GuildMember, GuildPremiumTier, OverwriteData, VoiceBasedChannel, VoiceChannel } from "discord.js";
import { DocumentType, mongoose } from "@typegoose/typegoose";
import { delay, inject, injectable, singleton } from "tsyringe";
import { PermissionOverwriteData } from "@models/PermissionOverwriteData";
import { interpolateString } from "@utils/interpolateString";
import { FilterOutFunctionKeys } from "@typegoose/typegoose/lib/types";
import { ChannelCouldNotBeCreatedError, ChannelNotTemporaryError, CouldNotKickUserError, NotInVoiceChannelError, RoomAlreadyLockedError } from "@types";
import { RoomModel } from "@models/Models";
import { VoiceChannelEvent } from "@models/Event";
import { Room } from "@models/Room";

@injectable()
@singleton()
export default class RoomManager {
    protected app: Application;

    constructor(@inject(delay(() => Application)) app: Application) {
        this.app = app;
    }

    /**
     * Retrieves the temporary voice channel associated with a guild member.
     * @param dbGuild - The guild object from the database.
     * @param member - The guild member for whom to retrieve the temporary voice channel.
     * @returns An object containing the voice channel and its corresponding database voice channel.
     * @throws {NotInVoiceChannelError} If the member is not in a voice channel.
     * @throws {ChannelNotTemporaryError} If the voice channel is not temporary.
     */
    public async getTemporaryVoiceChannel(dbGuild: Guild, member: GuildMember): Promise<{ voiceChannel: VoiceBasedChannel, databaseVoiceChannel: DatabaseVoiceChannel }> {
        // Check if user is in Voice Channel
        const channel = member?.voice.channel;
        if (!member || !channel) {
            this.app.logger.info("User is not in a voice channel.");
            throw new NotInVoiceChannelError();
        }

        // Get channel from DB
        const dbChannel = dbGuild.voice_channels.find(vc => vc._id === channel.id);

        // Check if channel is temporary
        if (!dbChannel?.temporary) {
            this.app.logger.info("Channel is not temporary.");
            throw new ChannelNotTemporaryError();
        }

        return { voiceChannel: channel, databaseVoiceChannel: dbChannel};
    }

    /**
     * Moves the specified members to the given room and updates the room data accordingly.
     * If the room does not have a database entry, it creates one.
     * 
     * @param members - An array of GuildMembers to be moved.
     * @param room - The VoiceChannel to which the members will be moved.
     * @param emmitedBy - The GuildMember who emitted the move event.
     * @param queue - The Queue associated with the move event.
     * @returns A Promise that resolves once the members are moved and the room data is saved.
     */
    public async moveMembersToRoom(members: GuildMember[], room: VoiceChannel, emmitedBy: GuildMember, queue: Queue): Promise<void> {
        let roomData = await RoomModel.findById(room.id);
        if (!roomData) {
            this.app.logger.info(`Room "${room.name}" in guild "${room.guild.name}" (id: ${room.guild.id}) does not have a database entry. Creating one.`);
            roomData = await this.createRoomOnDatabase(room);
        }
        for (const member of members) {
            try {
                await member.voice.setChannel(room);
                roomData.events.push({
                    emitted_by: emmitedBy.id,
                    reason: `Automated member move by queue "${queue.name}"`,
                    timestamp: Date.now().toString(),
                } as VoiceChannelEvent);
                this.app.logger.info(`Moved member "${member.displayName}" (id: ${member.id}) to room "${room.name}" in guild "${room.guild.name}" (id: ${room.guild.id})`)
            } catch (error) {
                this.app.logger.info(`Could not move member "${member.displayName}" (id: ${member.id}) to room "${room.name}" in guild "${room.guild.name}" (id: ${room.guild.id})`);
                continue;
            }
        }
        await roomData.save();
    }

    /**
     * Kicks a member from a room.
     * 
     * @param member - The member to be kicked from the room.
     * @param room - The room from which the member will be kicked.
     * @param emmitedBy - The member who initiated the kick action.
     * @throws {NotInVoiceChannelError} If the member is not in the specified voice channel.
     * @throws {CouldNotKickUserError} If the member could not be kicked from the room.
     */
    public async kickMemberFromRoom(member: GuildMember, room: VoiceBasedChannel, emmitedBy: GuildMember): Promise<void> {
        let roomData = await RoomModel.findById(room.id);
        if (!roomData) {
            this.app.logger.info(`Room "${room.name}" in guild "${room.guild.name}" (id: ${room.guild.id}) does not have a database entry. Creating one.`);
            roomData = await this.createRoomOnDatabase(room);
        }

        if (!room.members.has(member.id)) {
            this.app.logger.info(`Member "${member.displayName}" (id: ${member.id}) is not in room "${room.name}" in guild "${room.guild.name}" (id: ${room.guild.id})`);
            throw new NotInVoiceChannelError(member.id, room.id);
        }

        try {
            await member.voice.setChannel(null);
            roomData.events.push({
                emitted_by: emmitedBy.id,
                reason: `Member kicked by user "${emmitedBy.displayName}" (id: ${emmitedBy.id})`,
                timestamp: Date.now().toString(),
            } as VoiceChannelEvent);
            this.app.logger.info(`Kicked member "${member.displayName}" (id: ${member.id}) from room "${room.name}" in guild "${room.guild.name}" (id: ${room.guild.id}), initiated by "${emmitedBy.displayName}" (id: ${emmitedBy.id})`);
        } catch (error) {
            this.app.logger.info(`Could not kick member "${member.displayName}" (id: ${member.id}) from room "${room.name}" in guild "${room.guild.name}" (id: ${room.guild.id})`);
            throw new CouldNotKickUserError(member.id);
        }
    }

    /**
     * Kicks all members from a voice-based channel.
     * 
     * @param room - The voice-based channel to kick members from.
     * @param emmitedBy - The guild member who initiated the kick action.
     * @throws CouldNotKickUserError - If not all members could be kicked from the room.
     */
    public async kickMembersFromRoom(room: VoiceBasedChannel, emmitedBy: GuildMember): Promise<void> {
        let roomData = await RoomModel.findById(room.id);
        if (!roomData) {
            this.app.logger.info(`Room "${room.name}" in guild "${room.guild.name}" (id: ${room.guild.id}) does not have a database entry. Creating one.`);
            roomData = await this.createRoomOnDatabase(room);
        }

        let notKicked: GuildMember[] = [];
        for (const member of room.members.values()) {
            try {
                const room = member.voice.channel;
                await member.voice.setChannel(null);
                roomData.events.push({
                    emitted_by: emmitedBy.id,
                    reason: `Member kicked by user "${emmitedBy.displayName}" (id: ${emmitedBy.id})`,
                    timestamp: Date.now().toString(),
                } as VoiceChannelEvent);
                this.app.logger.info(`Kicked member "${member.displayName}" (id: ${member.id}) from room  "${room?.name}"in guild "${member.guild.name}" (id: ${member.guild.id}), initiated by "${emmitedBy.displayName}" (id: ${emmitedBy.id})`);
            } catch (error) {
                this.app.logger.info(`Could not kick member "${member.displayName}" (id: ${member.id}) from room "${room.name}" in guild "${member.guild.name}" (id: ${member.guild.id})`);
                notKicked.push(member);
                continue;
            }
        }
        if (notKicked.length > 0) {
            throw new CouldNotKickUserError(notKicked[0].id)
        }
    }

    /**
     * Locks a room and updates its database entry.
     * 
     * @param dbGuild - The database guild document.
     * @param room - The voice-based channel to be locked.
     * @param databaseVoiceChannel - The database representation of the voice channel.
     * @param emittedBy - The guild member who initiated the lock.
     * @returns A promise that resolves when the room is locked.
     * @throws {RoomAlreadyLockedError} If the room is already locked.
     */
    public async lockRoom(dbGuild: DocumentType<Guild>, room: VoiceBasedChannel, databaseVoiceChannel: DatabaseVoiceChannel, emittedBy: GuildMember): Promise<void> {
        let roomData = await RoomModel.findById(room.id);
        if (!roomData) {
            this.app.logger.info(`Room "${room.name}" in guild "${room.guild.name}" (id: ${room.guild.id}) does not have a database entry. Creating one.`);
            roomData = await this.createRoomOnDatabase(room);
        }

        if (databaseVoiceChannel.locked) {
            this.app.logger.info(`Room "${room.name}" in guild "${room.guild.name}" (id: ${room.guild.id}) is already locked.`);
            throw new RoomAlreadyLockedError(room.id);
        }

        databaseVoiceChannel.locked = true;
        await dbGuild.save();

        roomData.events.push({
            emitted_by: emittedBy.id,
            reason: `Room locked by user "${emittedBy.displayName}" (id: ${emittedBy.id})`,
            timestamp: Date.now().toString(),
        } as VoiceChannelEvent);
        await roomData.save();

        await room.permissionOverwrites.edit(room.guild.roles.everyone, { "Connect": false, "Speak": false });

        this.app.logger.info(`Locked room "${room.name}" in guild "${room.guild.name}" (id: ${room.guild.id}), initiated by "${emittedBy.displayName}" (id: ${emittedBy.id})`);
    }

    /**
     * Creates a room entry in the database.
     * 
     * @param room - The voice channel representing the room.
     * @returns A promise that resolves to the created room data.
     */
    private async createRoomOnDatabase(room: VoiceBasedChannel): Promise<DocumentType<Room>> {
        const roomData = await RoomModel.create({
            _id: room.id,
            active: true,
            tampered: false,
            end_certain: false,
            guild: room.guild.id,
        });
        this.app.logger.info(`Created database entry for room "${room.name}" in guild "${room.guild.name}" (id: ${room.guild.id})`);
        return roomData;
    }

    /**
     * Creates a tutoring voice channel for a given guild member and queue.
     * 
     * @param dbGuild - The guild document from the database.
     * @param dbQueue - The queue document from the database.
     * @param member - The guild member for whom the voice channel is being created.
     * @param students - The list of students in the queue.
     * @param roomNumber - The room number for the voice channel.
     * @returns A Promise that resolves to the created VoiceChannel.
     * @throws {ChannelCouldNotBeCreatedError} If the voice channel could not be created.
     */
    public async createTutoringVoiceChannel(dbGuild: Guild, dbQueue: DocumentType<Queue>, member: GuildMember, students: GuildMember[], roomNumber: number): Promise<VoiceChannel> {
        const guild = member.guild;
        const spawner = await this.getRoomSpawner(dbGuild, dbQueue, member, students, roomNumber);

        let room: VoiceChannel;
        try {
            room = await this.createTemporaryVoiceChannel(member, spawner)
        } catch (error) {
            const customError = new ChannelCouldNotBeCreatedError(dbQueue.name, guild.name);
            this.app.logger.error(customError.message + "\n" + error);
            throw customError;
        }

        const roomData = await this.createRoomOnDatabase(room);
        roomData.events.push({
            emitted_by: member.id,
            reason: `Automated room creation for queue "${dbQueue.name}"`,
            timestamp: Date.now().toString(),
        } as VoiceChannelEvent);
        await roomData.save();

        return room;
    }

    /**
     * Retrieves the room spawner for creating a voice channel room. If a spawner exists in the database, it is used. Otherwise, a new ad hoc spawner is created.
     * 
     * @param dbGuild - The guild document from the database.
     * @param dbQueue - The queue document from the database.
     * @param member - The guild member requesting the room spawner.
     * @param students - An array of queue entries representing the students in the queue.
     * @param roomNumber - The room number for the voice channel room.
     * @returns A Promise that resolves to a VoiceChannelSpawner object.
     */
    private async getRoomSpawner(dbGuild: Guild, dbQueue: DocumentType<Queue>, member: GuildMember, students: GuildMember[], roomNumber: number): Promise<VoiceChannelSpawner> {
        const guild = member.guild;
        let spawner: VoiceChannelSpawner | undefined = dbQueue.room_spawner?.toObject();
        const queueChannelData = dbGuild.voice_channels.find(channel => channel.queue && channel.queue._id.equals(dbQueue._id));
        const queueChannel = guild.channels.cache.get(queueChannelData?._id ?? "");
        const roomName = `${member.displayName}${member.displayName.endsWith("s") ? "'" : "s'"} ${dbQueue.name} Room ${roomNumber}`;
        const permissionOverwrites: PermissionOverwriteData[] = students.map(student => {
            return {
                id: student.id,
                allow: ["ViewChannel", "Connect", "Speak", "Stream"],
            } as PermissionOverwriteData;
        });

        if (!spawner) {
            spawner = {
                owner: member.id,
                supervisor_roles: queueChannelData?.supervisors ?? [],
                permission_overwrites: [...permissionOverwrites],
                max_users: 5,
                parent: queueChannel?.parentId ?? undefined,
                lock_initially: true,
                hide_initially: true,
                name: roomName,
            } as VoiceChannelSpawner;
            this.app.logger.info(`Created ad hoc room spawner for queue "${dbQueue.name}" in guild "${guild.name}" (id: ${guild.id})`);
        } else {
            spawner.name = spawner.name ?? roomName;
            this.app.logger.info(`Used existing room spawner for queue "${dbQueue.name}" in guild "${guild.name}" (id: ${guild.id})`);
        }
        spawner.permission_overwrites = new mongoose.Types.DocumentArray(permissionOverwrites);
        return spawner;
    }

    /**
     * Creates a temporary voice channel for a member using the provided spawner.
     * 
     * @param member - The guild member for whom the voice channel is being created.
     * @param spawner - The voice channel spawner object containing the configuration for the channel.
     * @returns A Promise that resolves to the created voice channel.
     */
    private async createTemporaryVoiceChannel(member: GuildMember, spawner: VoiceChannelSpawner): Promise<VoiceChannel> {
        let name = `${member.displayName}${member.displayName.endsWith("s") ? "'" : "s'"} Room`;
        if (spawner.name) {
            name = spawner.name;

            name = interpolateString(name, {
                "owner_name": member.displayName,
                "owner": member.id,
                "max_users": spawner.max_users,
            });
        }

        spawner.permission_overwrites.push({
            id: member.id,
            allow: ["ViewChannel", "Connect", "Speak", "Stream", "ManageChannels", "KickMembers"],
        });

        spawner.name = name;
        spawner.owner = member.id;
        return await this.createManagedVoiceChannel(member.guild, spawner);
    }

    /**
     * Creates a managed voice channel in the specified guild with the given options.
     * 
     * @param guild - The Discord guild where the voice channel will be created.
     * @param options - The options for creating the voice channel.
     * @returns A Promise that resolves to the created VoiceChannel.
     */
    private async createManagedVoiceChannel(guild: DiscordGuild, options: FilterOutFunctionKeys<VoiceChannelSpawner>): Promise<VoiceChannel> {
        const permissionOverwrites: OverwriteData[] = options.permission_overwrites;

        permissionOverwrites.push({
            id: guild.members.me!.id,
            allow: ["ViewChannel", "Connect", "Speak", "Stream", "MoveMembers", "ManageChannels", "DeafenMembers", "MuteMembers"],
        });

        // allow for Supervisors to see, join and edit the channel
        for (const role of options.supervisor_roles) {
            permissionOverwrites.push({
                id: role,
                allow: ["ViewChannel", "Connect", "Speak", "Stream", "MoveMembers", "ManageChannels", "DeafenMembers", "MuteMembers"],
            });
        }

        // Lock the channel if requested
        if (options.lock_initially) {
            permissionOverwrites.push({
                id: guild.roles.everyone.id,
                deny: ["Connect", "Speak"],
            });
        }

        // Hide the channel if requested
        if (options.hide_initially) {
            permissionOverwrites.push({
                id: guild.roles.everyone.id,
                deny: ["ViewChannel"],
            });
        }

        const bitrates: { [name in GuildPremiumTier]: number } = {
            "0": 96000,     // Unboosted
            "1": 128000,    // Boost Level 1
            "2": 256000,    // Boost Level 2
            "3": 384000,    // Boost Level 3
        };

        // Create a new Voice Channel
        const createdVoiceChannel = await guild.channels.create({
            name: options.name,
            type: ChannelType.GuildVoice,
            permissionOverwrites: permissionOverwrites,
            parent: options.parent,
            userLimit: options.max_users,
            bitrate: bitrates[guild.premiumTier],
        })
        this.app.logger.info(`Created managed voice channel "${createdVoiceChannel.name}" in guild "${guild.name}" (id: ${guild.id})`);

        // Create Database Entry
        const dbGuild = await this.app.configManager.getGuildConfig(guild);
        dbGuild.voice_channels.push({
            _id: createdVoiceChannel.id,
            channel_type: ChannelType.GuildVoice,
            owner: options.owner,
            locked: options.lock_initially,
            managed: true,
            permitted: new mongoose.Types.Array(),
            afkhell: false,
            category: options.parent,
            temporary: true,
            supervisors: options.supervisor_roles,
        } as FilterOutFunctionKeys<DatabaseVoiceChannel>);
        await dbGuild.save();
        this.app.logger.info(`Created database entry for managed voice channel "${createdVoiceChannel.name}" in guild "${guild.name}" (id: ${guild.id})`);

        return createdVoiceChannel;
    }
}