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
import { ChatInputCommandInteraction, Guild, GuildMember, TextBasedChannel, TextChannel, User } from 'discord.js';
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

    public mockUser(): User {
        const userId = randomInt(281474976710655).toString();
        return mockUser(this.app.client, { id: userId, username: userId, global_name: userId, discriminator: randomInt(9999).toString() });
    }

    public mockGuildMember(user: User = this.mockUser(), guild: Guild = this.mockGuild()): GuildMember {
        return mockGuildMember({
            client: this.app.client,
            user: user,
            guild: guild,
        });
    }

    public mockInteraction(commandName: string = "ping", channel?: TextChannel, guildMember?: GuildMember): ChatInputCommandInteraction {
        const guild = this.mockGuild();
        channel = channel ? channel : this.mockChannel(guild);
        guildMember = guildMember ? guildMember : this.mockGuildMember(this.mockUser(), guild);
        assert(guildMember.guild === guild);
        return mockChatInputCommandInteraction({ client: this.app.client, name: commandName, id: "test", channel: channel, member: guildMember })
    }
}