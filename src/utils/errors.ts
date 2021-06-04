import { DiscordAPIError, Message, MessageEmbed } from "discord.js"
import * as discord from "discord.js";
// : (message: Message, error: string, deleteinterval: number => Promise<Message>)
export const errorMessage = async (message: Message, error: string | Error, deleteinterval?: number) => {
    let embed = new MessageEmbed();
    embed.setColor(message.guild?.me?.roles.highest.color ? message.guild.me.roles.highest.color || 0x7289da : 0x7289da);
    embed.setTitle(`:x: __An Error Occured:__`)
    embed.setDescription((error instanceof Error) ? `${error.message}` : `${error}`);
    const sentMsg: Message = await message.channel.send(embed);
    if (deleteinterval) {
        sentMsg.delete({ timeout: deleteinterval });
    }
    return sentMsg;
}