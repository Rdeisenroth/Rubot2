import dotenv from "dotenv";
// Load the .env File
dotenv.config();
// Change the Current Working Directory to the Bot Folder
process.chdir(__dirname);
import { Bot } from "./bot";
// Start Bot
const botInstance = new Bot();
botInstance.start();
