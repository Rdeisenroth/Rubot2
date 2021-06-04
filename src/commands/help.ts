import { MessageEmbed } from "discord.js";
import { RunCommand } from "../../typings";

export const name = 'help';
export const description = 'List all of my commands or info about a specific command.';
export const aliases = ['commands'];
export const usage = '[command name]';
export const cooldown = 5;
export const category = "Miscellaneous";

export const execute: RunCommand = async (client, message, args) => {
    
}
