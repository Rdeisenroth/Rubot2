import { ClientEventListener, ExecuteEvent } from "../../typings";
import { Client, ClientEvents } from "discord.js";

export const execute: ExecuteEvent<"ready"> = async (client) => {
    console.log("I am Ready!");
    return true;
}

export const name="ready";