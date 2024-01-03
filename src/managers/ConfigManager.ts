import { delay, inject, injectable, singleton } from "tsyringe";
import { Guild as DiscordGuild } from "discord.js";
import { Guild, GuildModel } from "../models/Guild";
import { Bot } from "../Bot";
import { DocumentType } from "@typegoose/typegoose";

@injectable()
@singleton()
export default class ConfigManager {
    protected client: Bot;

    constructor(@inject(delay(() => Bot)) client: Bot) {
        this.client = client;
    }

    public async getGuildConfig(guild: DiscordGuild): Promise<DocumentType<Guild>> {
        var guildModel = await GuildModel.findById(guild.id);
        if (!guildModel) {
            this.client.logger.debug(`Config for guild ${guild.name} does not exist. Creating...`)
            return await this.getDefaultGuildConfig(guild);
        }
        this.client.logger.info(`Config for guild ${guild.name} already exists.`)
        return guildModel;
    }

    public async getDefaultGuildConfig(guild: DiscordGuild): Promise<DocumentType<Guild>> {
        const newGuildData = new GuildModel({
            _id: guild.id,
            name: guild.name,
            member_count: guild.memberCount,
            guild_settings: {
                command_listen_mode: 1,
                prefix: "!",
                slashCommands: [],
            },
            text_channels: [],
            voice_channels: [],
            queues: [],
        });
        await newGuildData.save();
        this.client.logger.info(`Created new Guild Config for ${guild.name} (id: ${guild.id})`);
        return newGuildData;
    }

    public async getGuildConfigs(): Promise<DocumentType<Guild>[]> {
        return await GuildModel.find();
    }
}