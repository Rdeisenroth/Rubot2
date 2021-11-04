import { Collection, Message, MessageAttachment, MessageEmbed } from "discord.js";
import { Command } from "../../../typings";
import { version as djsversion } from "discord.js";
import * as moment from "moment";
import "moment-duration-format";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { string } from "yargs";

/**
 * The Command Definition
 */
const command: Command = {
    name: "serverstats",
    aliases: ["ss"],
    guildOnly: false,
    description: "Shows general information about the bot.",
    category: "Miscellaneous",
    async execute(client, interaction, args) {
        if (!interaction || !interaction.guild) {
            return;
        }
        if (interaction instanceof Message) {
            client.utils.embeds.SimpleEmbed(interaction, "Slash Only Command", "This Command is Slash only but you Called it with The Prefix. use the slash Command instead.");
            return;
        }
        await interaction.deferReply();
        await interaction.guild.roles.fetch();
        const members = await interaction.guild.members.fetch();
        const verifiedRole = interaction.guild.roles.cache.find(x => x.name.toLowerCase() === "verified");
        const canvas = new ChartJSNodeCanvas(
            {
                height: 600,
                width: 800,
                chartCallback: (chartJs) => {

                },

            },
        );
        let dataa = new Collection<string, number>();
        let data = members.filter(x => x.joinedAt != null).sort((x, y) => (x.joinedAt!).getTime() - (y.joinedAt!).getTime());
        let days: { x: number, y: number }[] = [];
        for (const [id, m] of data) {
            let roundedDate = m.joinedAt!;
            roundedDate.setHours(0);
            roundedDate.setMinutes(0);
            roundedDate.setSeconds(0);
            roundedDate.setMilliseconds(0);
            const roundedDateString = roundedDate.getTime();
            let day = days.find(x => x.x === roundedDateString);
            if (day) {
                day.y++;
            } else {
                days.push({ x: roundedDateString, y: 1 });
            }
        }

        const image = await canvas.renderToBuffer(
            {
                type: "line",
                data: {
                    labels: days.map(x => {
                        const date = new Date(x.x);
                        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                    }),
                    datasets: [
                        {
                            label: "Member Count",
                            // data: [15, 20],
                            data: days,
                            fill: true,
                            borderColor: "rgba(0, 162, 255, 1)",
                            backgroundColor: "rgba(0, 162, 255, 0.5)",
                            // backgroundColor: "#7289d9",
                        },
                    ],
                },
                options: {
                    scales: {
                        x: {
                            grid: {
                                color: "#ffffff",
                            },
                            // ticks: {
                            //     display: false, //this will remove only the label
                            // },
                        },
                        y: {
                            grid: {
                                color: "#ffffff",
                            },
                            min: 0,
                        },
                    },
                },
            },
        );
        let attachment = new MessageAttachment(image, "graph.png");
        await client.utils.embeds.SimpleEmbed(interaction, {
            title: "Server Stats",
            text: "Server Information",
            empheral: false,
            fields: [
                { name: "❯ Members: ", value: `${interaction.guild.memberCount}`, inline: true },
                { name: "❯ Verified Members: ", value: `${verifiedRole?.members.size ?? 0}`, inline: true },
                { name: "❯ Unverified Members: ", value: `${interaction.guild.memberCount - (verifiedRole?.members.size ?? 0)}`, inline: true },
                { name: "❯ Channels: ", value: `${interaction.guild.channels.cache.size}`, inline: true },
                { name: "❯ Owner: ", value: `<@${interaction.guild.ownerId}>`, inline: true },
                { name: "❯ Created at: ", value: `<t:${Math.round(interaction.guild.createdAt.getTime() / 1000)}:f>`, inline: true },
            ],
            image: "attachment://graph.png",
            files: [
                attachment,
            ],
        });
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;