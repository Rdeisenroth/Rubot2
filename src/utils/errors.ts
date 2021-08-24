import { DiscordAPIError, Message, MessageEmbed } from "discord.js";
import * as discord from "discord.js";
import { APIMessage } from "discord-api-types/v9";
// : (message: Message, error: string, deleteinterval: number => Promise<Message>)
export const errorMessage = async (interaction: Message | discord.CommandInteraction, error: string | Error, deleteinterval?: number) => {
    if (!interaction.channel) {
        throw new Error("Embed Requires a Channel");
    }
    const embed = new MessageEmbed();
    embed.setColor(interaction.guild?.me?.roles.highest.color ? interaction.guild.me.roles.highest.color || 0x7289da : 0x7289da);
    embed.setTitle(":x: __An Error Occured:__");
    embed.setDescription((error instanceof Error) ? `${error.message}` : `${error}`);
    const res = await interaction.reply({ embeds: [embed] });
    let m: Message | APIMessage | null = null;
    if (res instanceof Message) {
        m = res;
    } else if (interaction instanceof discord.CommandInteraction) {
        m = await interaction.fetchReply();
    }
    if (deleteinterval) {
        setTimeout(() => m instanceof Message ? m.delete() : (interaction as discord.CommandInteraction).deleteReply(), deleteinterval);
    }
    return m;
};