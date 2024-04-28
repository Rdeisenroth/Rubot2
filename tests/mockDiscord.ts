import { jest } from '@jest/globals';
import {
    mockClientUser,
    mockGuild,
    mockGuildMember,
    mockTextChannel,
    mockUser,
    mockRole,
    mockChatInputCommandInteraction
} from '@shoginn/discordjs-mock';
import "reflect-metadata"
import { APIGuildMember, APIRole, APIUser, ChannelType, ChatInputCommandInteraction, Collection, DMChannel, Guild, GuildMember, PermissionOverwriteManager, Role, TextChannel, User, VoiceChannel, VoiceState } from 'discord.js';
import { container, singleton } from 'tsyringe';
import { randomInt } from 'crypto';
import assert from 'assert';
import { Application } from '@application';

@singleton()
export class MockDiscord {
    private app: Application;

    public getApplication(): Application {
        return this.app;
    }

    public constructor() {
        this.app = this.mockApplication();
    }

    private mockApplication(): Application {
        const clientOptions = { intents: [] };
        container.register("options", { useValue: clientOptions })
        container.register("token", { useValue: "test" })
        const app = container.resolve(Application);
        mockClientUser(app.client);

        app.client.login = jest.fn(() => Promise.resolve('LOGIN_TOKEN')) as any;
        return app;
    }

    public mockGuild(): Guild {
        const guildId = randomInt(281474976710655).toString();
        return mockGuild(this.app.client, undefined, { name: guildId, id: guildId });
    }

    public mockChannel(guild: Guild = this.mockGuild()): TextChannel {
        return mockTextChannel(this.app.client, guild);
    }

    public mockVoiceChannel(guild: Guild, {
        members = [],
    }: {
        members?: GuildMember[],
    } = {}): VoiceChannel {
        const voiceChannel = {
            id: randomInt(281474976710655).toString(),
            type: ChannelType.GuildVoice,
            name: "test voice channel",
            guild: guild,
            members: new Collection(members.map(member => [member.id, member])),
        } as any;
        Object.defineProperty(voiceChannel, "permissionOverwrites", {
            value: {
                edit: jest.fn(() => Promise.resolve()),
                delete: jest.fn(() => Promise.resolve())
            }
        });
        return voiceChannel;
    }

    public mockDMChannel(): DMChannel {
        return Reflect.construct(DMChannel, [this.app.client, {}]) as DMChannel;
    }

    public mockUser(): User {
        const userId = randomInt(281474976710655).toString();
        return mockUser(this.app.client, { id: userId, username: userId, global_name: userId, discriminator: randomInt(9999).toString() });
    }

    public mockRole(guild: Guild = this.mockGuild(), role: Partial<APIRole>): Role {
        return mockRole(this.app.client, "0", guild, role);
    }

    public mockGuildMember(user: User = this.mockUser(), guild: Guild = this.mockGuild(), roles?: string[]): GuildMember {
        return mockGuildMember({
            client: this.app.client,
            user: user,
            guild: guild,
            data: roles ? { roles: roles } : undefined
        });
    }

    public mockInteraction(commandName: string = "ping", channel?: TextChannel, guildMember?: GuildMember): ChatInputCommandInteraction {
        const guild = guildMember?.guild ?? this.mockGuild();
        channel = channel ? channel : this.mockChannel(guild);
        guildMember = guildMember ? guildMember : this.mockGuildMember(this.mockUser(), guild);
        assert(guildMember.guild === guild);
        return mockChatInputCommandInteraction({ client: this.app.client, name: commandName, id: "test", channel: channel, member: guildMember })
    }

    public mockVoiceState(guild: Guild, {
        channelID = randomInt(281474976710655).toString(),
        member = this.mockGuildMember(this.mockUser(), this.mockGuild()),
        numberOfMembersOfChannel = 1
    }: {
        channelID?: string | null,
        member?: GuildMember,
        numberOfMembersOfChannel?: number
    }): VoiceState {
        const apiMember = this.guildMemberToAPIGuildMember(member);
        const voiceState = Reflect.construct(VoiceState, [member.guild, {
            channel_id: channelID,
            user_id: member.id,
            member: apiMember,
            session_id: "test",
            deaf: false,
            mute: false,
            self_deaf: false,
            self_mute: false,
            self_video: false,
            suppress: false,
        }]) as VoiceState;
        Object.defineProperty(voiceState, "channel", {
            value: {
                type: ChannelType.GuildVoice,
                guild: guild,
                id: channelID,
                name: "test",
                members: { size: numberOfMembersOfChannel },
                deletable: true,
                delete: jest.fn(() => Promise.resolve())
            }
        })
        return voiceState;
    }

    private guildMemberToAPIGuildMember(member: GuildMember): APIGuildMember {
        return {
            user: this.userToAPIUser(member.user),
            nick: member.nickname,
            avatar: member.avatar,
            roles: member.roles.cache.map(role => role.id),
            joined_at: member.joinedAt!.toString(),
            premium_since: member.premiumSince?.toString(),
            deaf: member.voice.deaf ?? false,
            mute: member.voice.mute ?? false,
            flags: member.flags.bitfield,
        }
    }

    private userToAPIUser(user: User): APIUser {
        return {
            id: user.id,
            username: user.username,
            discriminator: user.discriminator,
            global_name: user.globalName,
            avatar: user.avatar,
            bot: user.bot,
            system: user.system,
            banner: user.banner,
            accent_color: user.accentColor,
        }
    }
}