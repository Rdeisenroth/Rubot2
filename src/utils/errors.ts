import { DiscordAPIError, Message, MessageEmbed } from "discord.js"
import * as discord from "discord.js";
// : (message: Message, error: string, deleteinterval: number => Promise<Message>)
export const errorMessage = async (interaction: Message | discord.Interaction, error: string | Error, deleteinterval?: number) => {
    if (!interaction.channel) {
        throw new Error("Embed Requires a Channel");
    }
    let embed = new MessageEmbed();
    embed.setColor(interaction.guild?.me?.roles.highest.color ? interaction.guild.me.roles.highest.color || 0x7289da : 0x7289da);
    embed.setTitle(`:x: __An Error Occured:__`)
    embed.setDescription((error instanceof Error) ? `${error.message}` : `${error}`);
    const sentMsg: Message = await interaction.channel.send({ embeds: [embed]});
    if (deleteinterval) {
        setTimeout(() => sentMsg.delete(), deleteinterval);
    }
    return sentMsg;
}