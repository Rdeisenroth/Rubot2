import { InternalGuildRoles } from "../../models/bot_roles";
import { Message, ApplicationCommandOptionType } from "discord.js";
import { Command } from "../../../typings";
import "moment-duration-format";
import { GuildModel } from "../../models/guilds";
import { RoleScopes } from "../../models/bot_roles";
import { mongoose } from "@typegoose/typegoose";



/**
 * The Command Definition
 */
const command: Command = {
    name: "updatebotroles",
    guildOnly: false,
    description: "This command updates or generates the database entries for the internal roles",
    options: [
        {
            name: "create-if-not-exists",
            description: "Create the Roles on the guild with the default name if they don't exist, defaults to true",
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
        const guild = interaction.guild;
        const dbGuild = await GuildModel.findById(guild.id);
        if (!dbGuild) {
            return await client.utils.embeds.SimpleEmbed(interaction, "Adminstration", "Guild not found in Database.");
        }

        const createIfNotExists = interaction.options.getBoolean("create-if-not-exists", false) ?? true;


        // Create the roles if they don't exist
        // iterate over type InternalGuildRoles
        for (const irn of InternalGuildRoles) {
            let r = guild.roles.cache.find(x => x.name === irn);
            const dbr = dbGuild.guild_settings.roles?.find(x => x.internal_name === irn);
            if (!r) {
                // try to find role by id from db
                if (dbr) {
                    const newR = interaction.guild.roles.resolve(dbr.role_id!);
                    if (newR) {
                        r = newR;
                        if (dbr.server_role_name !== r.name) {
                            console.log(`Role "${irn}" was renamed from "${dbr.server_role_name}" to "${r.name}". Updating DB`);
                            // update db
                            dbr.server_role_name = r.name;
                            await dbGuild.save();
                        }
                        continue;
                    }
                }
                if (!createIfNotExists) {
                    console.log(`role ${irn} not found in guild ${guild.name}. Skipping`);
                    continue;
                }
                console.log(`role ${irn} not found in guild ${guild.name}. Creating`);
                const newRole = await guild.roles.create({
                    name: irn,
                    mentionable: false,
                });
                if (!newRole) {
                    console.log(`Could not create role ${irn}`);
                    continue;
                }
                console.log(`created role ${irn}`);
                r = newRole;
            }
            if (!dbr) {
                console.log(`creating role ${irn}`);
                if (!dbGuild.guild_settings.roles) {
                    dbGuild.guild_settings.roles = new mongoose.Types.DocumentArray([]);
                }
                dbGuild.guild_settings.roles.push({
                    internal_name: irn,
                    role_id: r.id,
                    scope: RoleScopes.SERVER,
                    server_id: guild.id,
                    server_role_name: r.name,
                });
                await dbGuild.save();
            }
        }
        await client.utils.embeds.SimpleEmbed(
            interaction,
            "Adminstration",
            `Done generating internal Roles. Internal Roles: \n
            ${(dbGuild.guild_settings.roles?.map(x => `❯ ${x.internal_name}: <@&${x.role_id}>`).join("\n") ?? "None")}
            \nUnassigned Roles: \n
            ${InternalGuildRoles.filter(x => !dbGuild.guild_settings.roles?.find(y => y.internal_name === x)).map(x => `❯ ${x}`).join("\n") ?? "None"}`,
        );
    },
};

/**
 * Exporting the Command using CommonJS
 */
module.exports = command;