import { BotConfig } from "../../typings";

/**
 * This is a readonly data class that holds the config of the bot.
 */
export class ConfigHandler {
    private _config: BotConfig;
    private static _instance: ConfigHandler;

    private constructor(config: BotConfig) {
        if (ConfigHandler._instance) {
            throw new Error("ConfigHandler is a singleton class. Use ConfigHandler.instance to get the instance.");
        }
        this._config = config;
    }

    public get config(): BotConfig {
        return this._config;
    }

    public get<T extends keyof BotConfig>(key: T): BotConfig[T] {
        return this._config[key];
    }

    private static fromJSON(json: string): ConfigHandler {
        return ConfigHandler._instance = new ConfigHandler(JSON.parse(json));
    }

    private static fromEnv(): ConfigHandler {
        return ConfigHandler._instance = new ConfigHandler({
            token: process.env.TOKEN,
            prefix: process.env.PREFIX,
            ownerID: process.env.OWNER_ID,
            version: process.env.VERSION,
            current_season: process.env.CURRENT_SEASON,
            rlstatsapikey: process.env.RLSTATS_API_KEY,
            googlemapsapikey: process.env.GOOGLE_MAPS_API_KEY,
            steamapikey: process.env.STEAM_API_KEY,
            ballchasingapikey: process.env.BALLCHASING_API_KEY,
            mysqlhost: process.env.MYSQL_HOST,
            mysqluser: process.env.MYSQL_USER,
            mysqlpassword: process.env.MYSQL_PASSWORD,
            main_schema_name: process.env.MAIN_SCHEMA_NAME,
            mongodb_Connection_url: process.env.MONGODB_CONNECTION_URL,
            verify_secret: process.env.VERIFY_SECRET,
            disable_dm: process.env.DISABLE_DM,
            dm_only_verify: process.env.DM_ONLY_VERIFY,
        } as BotConfig);
    }

    public static getInstance(): ConfigHandler {
        if (ConfigHandler._instance) {
            return ConfigHandler._instance;
        }
        // if "LEGACY_JSON_CONFIG" is set, use the json config
        if (process.env.LEGACY_JSON_CONFIG) {
            return ConfigHandler.fromJSON(process.env.LEGACY_JSON_CONFIG);
        }
        return ConfigHandler.fromEnv();
    }
}