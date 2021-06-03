import { ClientEventListener, ExecuteEvent } from "../../typings";
import { Client, ClientEvents } from "discord.js";

export const name = "message";

export const execute: ExecuteEvent<"message"> = async (client, message) => {
    if(message.content.startsWith("!")){
        // Prepare command for execution
        const args = message.content.slice(1).split(/ +/);
        const commandName = (args.shift() as string).toLowerCase();
        if(commandName== "ping"){
            message.reply("Pong!");
        }
    }
    return true;
}
