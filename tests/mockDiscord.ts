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
import { APIRole, ChatInputCommandInteraction, DMChannel, Guild, GuildMember, Role, TextChannel, User, VoiceState } from 'discord.js';
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

    // public mockVoiceState(guild: Guild = this.mockGuild(), channelID: string | null = "123", member: GuildMember = this.mockGuildMember(this.mockUser(), guild)): VoiceState {
    public mockVoiceState({
        guild = this.mockGuild(),
        channelID = "123",
        member = this.mockGuildMember(this.mockUser(), guild)
    }: {
        guild?: Guild,
        channelID?: string | null,
        member?: GuildMember
    }): VoiceState {
        return Reflect.construct(VoiceState, [guild, { channelID: channelID, member: member }]);
    }
}