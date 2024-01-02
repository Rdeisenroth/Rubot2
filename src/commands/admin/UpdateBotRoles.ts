import { ApplicationCommandOptionType, Guild as DiscordGuild, EmbedBuilder } from "discord.js";
import { BaseCommand } from "../../baseCommand";
import { InternalGuildRoles, RoleScopes } from "../../models/BotRoles";
import { Guild as DatabaseGuild } from "../../models/Guild";
import { DocumentType, mongoose } from "@typegoose/typegoose";

export default class UpdateBotRolesCommand extends BaseCommand {
    public static name = "updatebotroles";
    public static description = "Creates or updates the database entries for the internal roles";
    public static options = [
        {
            name: "create-if-not-exists",
            description: "Create the Roles on the guild with the default name if they don't exist, defaults to true",
            type: ApplicationCommandOptionType.Boolean,
            required: false,
            default: true,
        },
    ];

    public async execute(): Promise<void> {
        await this.defer();
        if (!this.interaction.guild) {
            throw new Error("Interaction is not in a guild");
        }
        const dbGuild = await this.client.configManager.getGuildConfig(this.interaction.guild)
        const createIfNotExists = await this.getOptionValue(UpdateBotRolesCommand.options[0]);
        await this.createDbRoles(this.interaction.guild, dbGuild, createIfNotExists);
        const embed = this.mountRoleEmbed(dbGuild);
        await this.send({ embeds: [embed] });

        this.client.logger.info(`Done generating internal Roles for guild ${this.interaction.guild.name}`);
    }

    private mountRoleEmbed(dbGuild: DatabaseGuild): EmbedBuilder {
        const description: string = `Done generating internal Roles. Internal Roles: \n` +
            `${(dbGuild.guild_settings.roles?.map(x => `❯ ${x.internal_name}: <@&${x.role_id}>`).join("\n") ?? "None")}\n` +
            `Unassigned Roles:\n` +
            `${InternalGuildRoles.filter(x => !dbGuild.guild_settings.roles?.find(y => y.internal_name === x)).map(x => `❯ ${x}`).join("\n") ?? "None"}`;
        const embed = new EmbedBuilder()
            .setTitle("Administration")
            .setDescription(description)
        return embed
    }

    private async createDbRoles(discordGuild: DiscordGuild, dbGuild: DocumentType<DatabaseGuild>, createIfNotExists: boolean): Promise<void> {
        // Create the roles if they don't exist
        // iterate over type InternalGuildRoles
        for (const internalGuildRoleName of InternalGuildRoles) {
            let roleOnDiscordServer = discordGuild.roles.cache.find((role) => role.name === internalGuildRoleName);
            const roleInDatabase = dbGuild.guild_settings.roles?.find((role) => role.internal_name === internalGuildRoleName);
            if (!roleOnDiscordServer) {
                // try to find role by id from db
                if (roleInDatabase) {
                    const roleOnDiscordServerById = this.interaction.guild!.roles.resolve(roleInDatabase.role_id!);
                    if (roleOnDiscordServerById) {
                        roleOnDiscordServer = roleOnDiscordServerById;
                        if (roleInDatabase.server_role_name !== roleOnDiscordServer.name) {
                            this.client.logger.debug(`Role "${internalGuildRoleName}" was renamed from "${roleInDatabase.server_role_name}" to "${roleOnDiscordServer.name}". Updating DB`);
                            // update db
                            roleInDatabase.server_role_name = roleOnDiscordServer.name;
                            await dbGuild.save();
                        } else {
                            this.client.logger.debug(`Role ${internalGuildRoleName} found in guild ${discordGuild.name}. Role was not renamed.`);
                        }
                        continue;
                    }
                }
                if (!createIfNotExists) {
                    this.client.logger.debug(`Role ${internalGuildRoleName} not found in guild ${discordGuild.name}. Skipping`);
                    continue;
                }
                this.client.logger.debug(`Role ${internalGuildRoleName} not found in guild ${discordGuild.name}. Creating`);
                const newRole = await discordGuild.roles.create({
                    name: internalGuildRoleName,
                    mentionable: false,
                });
                if (!newRole) {
                    this.client.logger.debug(`Could not create role ${internalGuildRoleName} in guild ${discordGuild.name}`);
                    continue;
                }
                this.client.logger.debug(`Created role ${internalGuildRoleName} with id ${newRole.id} in guild ${discordGuild.name}`);
                roleOnDiscordServer = newRole;
            } else {
                this.client.logger.debug(`Role ${internalGuildRoleName} found in guild ${discordGuild.name}`);
            }
            if (!roleInDatabase) {
                this.client.logger.debug(`Creating role ${internalGuildRoleName} for guild ${discordGuild.name} in database`);
                if (!dbGuild.guild_settings.roles) {
                    dbGuild.guild_settings.roles = new mongoose.Types.DocumentArray([]);
                }
                dbGuild.guild_settings.roles.push({
                    internal_name: internalGuildRoleName,
                    role_id: roleOnDiscordServer.id,
                    scope: RoleScopes.SERVER,
                    server_id: discordGuild.id,
                    server_role_name: roleOnDiscordServer.name,
                });
                await dbGuild.save();
            } else {
                this.client.logger.debug(`Role ${internalGuildRoleName} found in database`);
            }
        }
    }
}