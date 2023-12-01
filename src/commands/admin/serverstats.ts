import { ApplicationCommandOptionType, AttachmentBuilder, AuditLogEvent, Collection, GuildAuditLogsEntry, Message } from "discord.js";
import { Command } from "../../../typings";
import "moment-duration-format";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { APIRole } from "discord-api-types/v9";


/**
 * The Command Definition
 */
const command: Command = {
    name: "serverstats",
    aliases: ["ss"],
    guildOnly: false,
    description: "Shows general information about the bot.",
    category: "Miscellaneous",
    options: [
        {
            name: "show-empty-days",
            description: "Whether or not to show empty days in graph",
            type: ApplicationCommandOptionType.Boolean,
            required: false,
        },
    ],
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
            },
        );
        // Member Joins
        const data = [...members.values()].filter(x => x.joinedAt != null).sort((x, y) => (x.joinedAt!).getTime() - (y.joinedAt!).getTime());
        const days: { x: number, y: number, z: number }[] = [];
        if (data && interaction.options.getBoolean("show-empty-days")) {
            const firstDay = data[0].joinedAt!;
            const lastDay = new Date();
            firstDay.setHours(0, 0, 0, 0);
            lastDay.setHours(0, 0, 0, 0);
            for (let i = firstDay.getTime(); i <= lastDay.getTime(); i += 86400000) {
                days.push({ x: i, y: 0, z: 0 });
            }
        }
        for (const m of data) {
            const roundedDate = m.joinedAt!;
            roundedDate.setHours(0, 0, 0, 0);
            const roundedDateString = roundedDate.getTime();
            const day = days.find(x => x.x === roundedDateString);
            if (day) {
                day.y++;
            } else {
                days.push({ x: roundedDateString, y: 1, z: 0 });
            }
        }
        // Verifications
        let roleLog: Collection<string, GuildAuditLogsEntry<AuditLogEvent.MemberRoleUpdate>> = new Collection();
        try {
            roleLog = (await interaction.guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate })).entries;
        } catch (error) {
            console.error(error);
        }
        for (const [id, e] of roleLog) {
            // verifyDays.push({})
            // console.log(e);
            for (const c of e.changes ?? []) {
                for (const r of ((c.new ?? []) as APIRole[])) {
                    if (r.id === verifiedRole?.id) {
                        const roundedDate = e.createdAt;
                        roundedDate.setHours(0, 0, 0, 0);
                        const roundedDateString = roundedDate.getTime();
                        const day = days.find(x => x.x === roundedDateString);
                        if (day) {
                            day.z++;
                        } else {
                            days.push({ x: roundedDateString, y: 0, z: 1 });
                        }
                    }
                }
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
                            label: "Member Join Count",
                            // data: [15, 20],
                            data: days,
                            fill: true,
                            borderColor: "rgba(0, 162, 255, 1)",
                            backgroundColor: "rgba(0, 162, 255, 0.5)",
                            // backgroundColor: "#7289d9",
                        },
                        {
                            label: "Member Verify Count",
                            // data: [15, 20],
                            data: days,
                            parsing: {
                                yAxisKey: "z",
                            },
                            fill: true,
                            borderColor: "rgba(162, 162, 162, 1)",
                            backgroundColor: "rgba(162, 162, 162, 0.5)",
                            // backgroundColor: "#7289d9",
                        },
                    ],
                },
                options: {
                    // font: {
                    //     size: 42,
                    // },
                    plugins: {
                        legend: {
                            labels: {
                                color: "#ffffff",
                                font: {
                                    size: 12,
                                },
                            },
                        },
                    },
                    scales: {
                        x: {
                            grid: {
                                color: "#ffffff",
                            },
                            ticks: {
                                color: "#ffffff",
                                font: {
                                    size: 12,
                                },
                                // display: false, //this will remove only the label
                            },
                        },
                        y: {
                            grid: {
                                color: "#ffffff",
                            },
                            ticks: {
                                color: "#ffffff",
                                font: {
                                    size: 12,
                                },
                            },
                            min: 0,
                        },
                    },
                },
            },
        );
        const attachment = new AttachmentBuilder(image, { name: "graph.png" });
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