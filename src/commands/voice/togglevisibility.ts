import { Command } from "../../../typings";
import { GuildModel } from "../../models/guilds";

const command: Command = {
    name: "togglevisibility",
    description: "hides or unhides the current voice Channel",
    aliases: ["togglevis", "tv", "hideorunhide", "hou", "vis"],
    cooldown: 5,
    category: "Miscellaneous",
    guildOnly: true,
    execute: async (client, interaction, args) => {

        const g = interaction!.guild!;

        // Check if user is in VC
        const member = client.utils.general.getMember(interaction);
        const channel = member?.voice.channel;
        if (!member || !channel) {
            await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", "You are currently not in a Voice Channel on this Server.");
            return;
        }

        // Get Channel from DB
        const guildData = (await GuildModel.findById(g.id));
        const channelData = guildData!.voice_channels.find(x => x._id == channel!.id);

        if (!channelData?.temporary) {
            return await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", "The Voice Channel you are in is not a Temporary Voice Channel.");
        }

        // Check if User has Permission to Hide/Unhide the Channel
        if (!(channelData.owner === member.id || (channelData.supervisors && channelData.supervisors.includes(member.id)))) {
            return await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", "You have no Permission to Lock/Unlock the current Voice Channel.");
        }

        // Check if Visible or invisible
        const overwrites = channel.permissionOverwrites.cache.get(g.roles.everyone.id);
        let hidden = false;
        if (overwrites && overwrites.deny?.has("ViewChannel")) {
            hidden = true;
        }

        // Change permissions for everyone
        await channel.permissionOverwrites.edit(g.roles.everyone.id, { ViewChannel: hidden });

        await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", `Your Channel was ${hidden ? "**unhidden**" : "**hidden**"}.`);
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;