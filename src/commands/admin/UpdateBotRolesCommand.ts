import { ApplicationCommandOptionType, Guild as DiscordGuild, EmbedBuilder, Role } from "discord.js";
import { BaseCommand } from "@baseCommand";
import { DBRole, InternalGuildRoles, RoleScopes } from "@models/BotRoles";
import { Guild as DatabaseGuild } from "@models/Guild";
import { ArraySubDocumentType, DocumentType, mongoose } from "@typegoose/typegoose";

export default class UpdateBotRolesCommand extends BaseCommand {
    public static name = "update_bot_roles";
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

    /**
     * The guild saved in the database.
     */
    private dbGuild!: DocumentType<DatabaseGuild>;

    public async execute(): Promise<void> {
        await this.defer();
        if (!this.interaction.guild) {
            throw new Error("Interaction is not in a guild");
        }
        this.dbGuild = await this.app.configManager.getGuildConfig(this.interaction.guild)
        const createIfNotExists = Boolean(this.getOptionValue(UpdateBotRolesCommand.options[0]));
        await this.createDbRoles(createIfNotExists);
        const embed = this.mountRoleEmbed();
        await this.send({ embeds: [embed] });

        this.app.logger.info(`Done generating internal Roles for guild "${this.interaction.guild.name}" (id: ${this.interaction.guild.id})`);
    }

    /**
     * Returns the role embed to be sent to the user.
     * @returns The embed to be sent to the user.
     */
    private mountRoleEmbed(): EmbedBuilder {
        const description: string = `Done generating internal Roles. Internal Roles: \n` +
            `${(this.dbGuild.guild_settings.roles?.map(x => `❯ ${x.internal_name}: <@&${x.role_id}>`).join("\n") ?? "None")}\n` +
            `Unassigned Roles:\n` +
            `${InternalGuildRoles.filter(x => !this.dbGuild.guild_settings.roles?.find(y => y.internal_name === x)).map(x => `❯ ${x}`).join("\n") ?? "None"}`;
        const embed = new EmbedBuilder()
            .setTitle("Administration")
            .setDescription(description)
        return embed
    }

    /**
     * Creates the internal roles in the database and on the guild if they don't exist.
     * @param createIfNotExists Whether to create the roles on the guild if they don't exist.
     */
    private async createDbRoles(createIfNotExists: boolean): Promise<void> {
        for (const internalGuildRoleName of InternalGuildRoles) {
            const roleOnDiscordServer = await this.findRoleOnDiscordServer(internalGuildRoleName);
            const roleInDatabase = this.dbGuild.guild_settings.roles?.find((role) => role.internal_name === internalGuildRoleName);
            await this.processRole(internalGuildRoleName, roleInDatabase, roleOnDiscordServer, createIfNotExists);
        }
    }

    /**
     * Returns the role with the given name on the guild.
     * @param internalGuildRoleName The name of the role to find.
     * @returns The role if found, undefined otherwise.
     */
    private async findRoleOnDiscordServer(internalGuildRoleName: string): Promise<Role | undefined> {
        return this.interaction.guild!.roles.cache.find((role) => role.name === internalGuildRoleName);
    }

    /**
     * Returns the role with the given id on the guild.
     * @param roleId The id of the role to find.
     * @returns The role if found, null otherwise.
     */
    private async findRoleByIdFromDatabase(roleId: string): Promise<Role | null> {
        return this.interaction.guild!.roles.resolve(roleId);
    }

    /**
     * Processes the role with the given name.
     * 
     * This means:
     * - If the role doesn't exist on the guild, create it if `createIfNotExists` is true.
     * - If the role doesn't exist in the database, create it.
     * - If the role exists in the database but has a different name, update the name in the database.
     * 
     * @param internalGuildRoleName The name of the role to process.
     * @param roleInDatabase The role in the database.
     * @param roleOnDiscordServer The role on the guild.
     * @param createIfNotExists Whether to create the role on the guild if it doesn't exist.
     */
    private async processRole(internalGuildRoleName: string, roleInDatabase: ArraySubDocumentType<DBRole> | undefined, roleOnDiscordServer: Role | undefined, createIfNotExists: boolean): Promise<void> {
        if (!roleOnDiscordServer) {
            if (roleInDatabase) {
                const roleOnDiscordServerById = await this.findRoleByIdFromDatabase(roleInDatabase.role_id!);
                if (roleOnDiscordServerById) {
                    roleOnDiscordServer = roleOnDiscordServerById;
                    if (roleInDatabase.server_role_name !== roleOnDiscordServer.name) {
                        await this.updateRoleInDatabase(roleInDatabase, roleOnDiscordServer.name);
                    } else {
                        this.app.logger.debug(`Role ${internalGuildRoleName} found in guild ${this.interaction.guild!.name}. Role was not renamed.`);
                    }
                    return;
                }
            }
            if (!createIfNotExists) {
                this.app.logger.debug(`Role ${internalGuildRoleName} not found in guild ${this.interaction.guild!.name}. Skipping`);
                return;
            }
            roleOnDiscordServer = await this.createRoleOnDiscordServer(internalGuildRoleName);
        } else {
            this.app.logger.debug(`Role ${internalGuildRoleName} found in guild ${this.interaction.guild!.name}`);
        }
    
        if (!roleInDatabase) {
            await this.createRoleInDatabase(internalGuildRoleName, roleOnDiscordServer!);
        } else {
            this.app.logger.debug(`Role ${internalGuildRoleName} found in database`);
        }
    }
    
    /**
     * Updates the role name in the database.
     * @param roleInDatabase The role in the database.
     * @param newRoleName The new name of the role.
     */
    private async updateRoleInDatabase(roleInDatabase: ArraySubDocumentType<DBRole>, newRoleName: string): Promise<void> {
        this.app.logger.debug(`Role "${roleInDatabase.internal_name}" was renamed from "${roleInDatabase.server_role_name}" to "${newRoleName}". Updating DB`);
        roleInDatabase.server_role_name = newRoleName;
        await this.dbGuild.save();
    }
    
    /**
     * Creates the role with the given name on the guild.
     * @param internalGuildRoleName The name of the role to create.
     * @returns The created role.
     */
    private async createRoleOnDiscordServer(internalGuildRoleName: string): Promise<Role> {
        this.app.logger.debug(`Role ${internalGuildRoleName} not found in guild ${this.interaction.guild!.name}. Creating`);
        const newRole = await this.interaction.guild!.roles.create({
            name: internalGuildRoleName,
            mentionable: false,
        });
        this.app.logger.debug(`Created role ${internalGuildRoleName} with id ${newRole.id} in guild ${this.interaction.guild!.name}`);
        return newRole;
    }
    
    /**
     * Creates the role from the discord guid with the given name in the database.
     * @param internalGuildRoleName The name of the role to create.
     * @param roleOnDiscordServer The role on the discord guild.
     */
    private async createRoleInDatabase(internalGuildRoleName: string, roleOnDiscordServer: Role): Promise<void> {
        this.app.logger.debug(`Creating role ${internalGuildRoleName} for guild ${this.interaction.guild!.name} in database`);
        if (!this.dbGuild.guild_settings.roles) {
            this.dbGuild.guild_settings.roles = new mongoose.Types.DocumentArray([]);
        }
        this.dbGuild.guild_settings.roles.push({
            internal_name: internalGuildRoleName,
            role_id: roleOnDiscordServer.id,
            scope: RoleScopes.SERVER,
            server_id: this.interaction.guild!.id,
            server_role_name: roleOnDiscordServer.name,
        });
        await this.dbGuild.save();
    }
}