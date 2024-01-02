import { jest } from '@jest/globals';
import {
    mockClientUser,
    mockGuild,
    mockGuildMember,
    mockTextChannel,
    mockUser,
    mockChatInputCommandInteraction
} from '@shoginn/discordjs-mock';
import "reflect-metadata"
import { Bot } from '../src/Bot';
import { ChatInputCommandInteraction, Guild, GuildMember, TextBasedChannel, TextChannel, User } from 'discord.js';
import { container, singleton } from 'tsyringe';
import { randomInt } from 'crypto';
import assert from 'assert';

@singleton()
export class MockDiscord {
    private client!: Bot;
    // private guild!: Guild;
    // private channel!: TextChannel;
    // private user!: User;
    // private guildMember!: GuildMember;
    // private interaction!: ChatInputCommandInteraction;


    public getClient(): Bot {
        return this.client;
    }

    // getClient(withBots: boolean = false): Bot {
    //     if (withBots) {
    //         const botUser = mockUser(this.client, { bot: true });
    //         mockGuildMember({
    //             client: this.client,
    //             user: botUser,
    //             guild: this.guild,
    //         });
    //     }
    //     return this.client;
    // }

    // getUser(): User {
    //     return this.user;
    // }

    // resetGuild(): void {
    //     this.mockGuild();
    // }

    // getGuild(): Guild {
    //     return this.guild;
    // }

    // getGuildMember(): GuildMember {
    //     return this.guildMember;
    // }

    // getChannel(): TextBasedChannel {
    //     return this.channel;
    // }

    // getNewInteraction(): ChatInputCommandInteraction {
    //     this.mockInteraction();
    //     return this.interaction;
    // }

    public constructor() {
        this.client = this.mockClient();
        //     this.mockGuild();
        //     this.mockUser();
        //     this.mockGuildMember();
        //     this.mockChannel();
        //     this.mockInteraction();
    }

    private mockClient(): Bot {
        const clientOptions = { intents: [] };
        container.register("options", { useValue: clientOptions })
        container.register("token", { useValue: "test" })
        const client = container.resolve(Bot);
        mockClientUser(client);

        client.login = jest.fn(() => Promise.resolve('LOGIN_TOKEN')) as any;
        return client;
    }

    public mockGuild(): Guild {
        const guildId = randomInt(281474976710655).toString();
        return mockGuild(this.client, undefined, { name: guildId, id: guildId });
    }

    public mockChannel(guild: Guild = this.mockGuild()): TextChannel {
        return mockTextChannel(this.client, guild);
    }

    public mockUser(): User {
        return mockUser(this.client);
    }

    public mockGuildMember(user: User = this.mockUser(), guild: Guild = this.mockGuild()): GuildMember {
        return mockGuildMember({
            client: this.client,
            user: user,
            guild: guild,
        });
    }

    public mockInteraction(channel?: TextChannel, guildMember?: GuildMember): ChatInputCommandInteraction {
        const guild = this.mockGuild();
        channel = channel ? channel : this.mockChannel(guild);
        guildMember = guildMember ? guildMember : this.mockGuildMember(this.mockUser(), guild);
        assert(guildMember.guild === guild);
        return mockChatInputCommandInteraction({ client: this.client, name: "test", id: "test", channel: channel, member: guildMember })
    }
}