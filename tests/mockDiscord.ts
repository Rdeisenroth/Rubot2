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
import { singleton } from 'tsyringe';

@singleton()
export class MockDiscord {
    private client!: Bot;
    private guild!: Guild;
    private channel!: TextChannel;
    private user!: User;
    private guildMember!: GuildMember;
    private interaction!: ChatInputCommandInteraction;


    getClient(withBots: boolean = false): Bot {
        if (withBots) {
            const botUser = mockUser(this.client, { bot: true });
            mockGuildMember({
                client: this.client,
                user: botUser,
                guild: this.guild,
            });
        }
        return this.client;
    }
    getUser(): User {
        return this.user;
    }
    getGuild(): Guild {
        return this.guild;
    }

    getGuildMember(): GuildMember {
        return this.guildMember;
    }

    getChannel(): TextBasedChannel {
        return this.channel;
    }

    getInteraction(): ChatInputCommandInteraction {
        return this.interaction;
    }

    public constructor() {
        this.mockClient();
        this.mockGuild();
        this.mockUser();
        this.mockGuildMember();
        this.mockChannel();
        this.mockInteraction();
    }

    private mockClient(): void {
        // this.client = new Client({ intents: [] });
        this.client = new Bot({ intents: [] }, "test");
        mockClientUser(this.client);

        this.client.login = jest.fn(() => Promise.resolve('LOGIN_TOKEN')) as any;
    }

    private mockGuild(): void {
        this.guild = mockGuild(this.client);
    }
    private mockChannel(): void {
        this.channel = mockTextChannel(this.client, this.guild);
    }

    private mockUser(): void {
        this.user = mockUser(this.client);
    }

    private mockGuildMember(): void {
        this.guildMember = mockGuildMember({
            client: this.client,
            user: this.user,
            guild: this.guild,
        });
    }

    private mockInteraction(): void {
        this.interaction = mockChatInputCommandInteraction({ client: this.client, name: "test", id: "test", channel: this.channel, member: this.guildMember })
    }
}