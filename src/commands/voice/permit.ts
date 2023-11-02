import { ApplicationCommandOptionType, GuildMember, Message } from "discord.js";
import { Command } from "../../../typings";
import { GuildModel } from "../../models/guilds";

const command: Command = {
    name: "permit",
    description: "permits a User to join and view the channel even if it's locked or hidden",
    aliases: ["p", "pm", "allow", "invite", "inv"],
    usage: "[channel resolvable]",
    cooldown: 5,
    options: [{
        name: "member",
        description: "The member to Permit",
        type: ApplicationCommandOptionType.User,
        required: true,
    }],
    category: "Miscellaneous",
    guildOnly: true,
    execute: async (client, interaction, args) => {
        //let owner = client.users.cache.find(m => m.id == client.config.get("ownerID"));
        // if (message?.author.id !== client.config.get("ownerID") as String) {
        //     return await message?.reply(`You do not have permission to execute this command.`);
        // }

        if (!interaction) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, "Slash Only Command", "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.");
            return;
        }

        const g = interaction.guild!;

        // Check if user is in VC
        const channelOwner = client.utils.general.getMember(interaction);
        const channel = channelOwner?.voice.channel;
        if (!channelOwner || !channel) {
            await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", "You are currently not in a Voice Channel on this Server.");
            return;
        }

        // Get Channel from DB
        const guildData = (await GuildModel.findById(g.id));
        const channelData = guildData!.voice_channels.find(x => x._id == channel!.id);

        if (!channelData?.temporary) {
            return await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", "The Voice Channel you are in is not a Temporary Voice Channel.");
        }

        // Check if User has Permission to lock/Unlock Channel
        if (!(channelData.owner === channelOwner.id || (channelData.supervisors && channelData.supervisors.includes(channelOwner.id)))) {
            return await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", "You have no Permission to Permit a Member.");
        }

        const permitMember = interaction.options.getMember("member");

        if (!(permitMember instanceof GuildMember)) {
            return await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", "You have to specify a valid Member.");
        }

        if (permitMember.id === channelData.owner) {
            return await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", "The Channel Owner can always join a channel.");
        }

        if (channelData.permitted.includes(permitMember.id)) {
            const memberperms = channel.permissionOverwrites.cache.get(permitMember.id);
            if (!memberperms || !memberperms.allow.has("ViewChannel") || !memberperms.allow.has("Connect") || !memberperms.allow.has("Speak")) {
                await channel.permissionOverwrites.edit(permitMember.id, { "ViewChannel": true, "Connect": true, "Speak": true });
                return await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", "Someone messed with My permissions... :angry: Should be fixed now. :thumbsup: ");
            } else {
                return await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", "The member already has Permission to join your channel.");
            }
        }

        // Cange Permitted Users in DB
        channelData.permitted.push(permitMember.id);
        await guildData!.save();

        await channel.permissionOverwrites.edit(permitMember.id, { "ViewChannel": true, "Connect": true, "Speak": true });

        await client.utils.embeds.SimpleEmbed(interaction!, "Temporary Voice Channel System", `${permitMember} was permitted to join your channel.`);
    },
};

async function sleep(msec: number) {
    return new Promise(resolve => setTimeout(resolve, msec));
}

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;