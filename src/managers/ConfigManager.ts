// import { singleton } from "tsyringe";
// import "reflect-metadata";
// import { GuildConfig, DefaultGuildConfig } from "types/GuildConfig";

// @singleton()
// class ConfigManager {
//     private static instance: ConfigManager;
//     public hasLoaded: boolean = false;

//     private guildsConfig: GuildConfig[] = [];
//     private static readonly defaultGuildConfig: DefaultGuildConfig = {
//     }

//     public constructor() { 
//         // this.load();
//     }

//     public static getInstance(): ConfigManager {
//         if (!ConfigManager.instance) {
//             ConfigManager.instance = new ConfigManager();
//         }

//         return ConfigManager.instance;
//     }

//     public getGuildConfig(guildId: string): GuildConfig | DefaultGuildConfig {
//         const guildConfig = this.guildsConfig.find(guildConfig => guildConfig.id === guildId);

//         if (!guildConfig) {
//             return this.getDefaultGuildConfig();
//         }

//         return guildConfig;
//     }

//     public getDefaultGuildConfig(): DefaultGuildConfig {
//         return ConfigManager.defaultGuildConfig;
//     }
// }