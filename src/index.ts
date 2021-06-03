// Change the Current Working Directory to the Bot Folder
process.chdir(__dirname);
import { BotEvent, ClientEventListener, Configuration } from "../typings/index";
// import * as config from '../config.json';
const config: Configuration = require('../config.json');
import * as Discord from 'discord.js';
import { promisify } from "util";
import * as fs from 'fs';
import glob from 'glob';
const client = new Discord.Client();
const start = async () => {
    // Config.
    console.log("starting...");
    // client.on('ready', () => { console.log("I am Up and running!") });
    // client.on('message', (message) => { if(message.content.includes("ping")) message.reply("Pong!") });
    // client.on('unhandledRejection', error => {
    //     console.log('Test error:', error);
    // });
    const globPromise = promisify(glob);
    const eventFiles: string[] = await globPromise(
        `${__dirname}/events/**/*{.js,.ts}`
    );
    eventFiles.map(async (eventFile: string) => {
        const ev = (await import(eventFile)) as BotEvent<any>;
        console.log(`file: ${eventFile}, name: ${JSON.stringify(ev.name)}`)
        client.on(ev.name, ev.execute.bind(null, client));
    });
}
start();
// async regEvent(eventFile: string){

// }
client.login(config.token);
console.log("hi");
console.log("hi");
console.log("hi");
console.log("hi");