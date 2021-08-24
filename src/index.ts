// Change the Current Working Directory to the Bot Folder
process.chdir(__dirname);
import { BotConfig } from "../typings/index";
import { Bot } from "./bot";
const config: BotConfig = require("../config.json");
// Start Bot
const botInstance = new Bot();
botInstance.start(config);