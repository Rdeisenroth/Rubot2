import { Application } from "@application";
import { delay, inject, injectable, singleton } from "tsyringe";
import { User as DiscordUser } from "discord.js";
import { DocumentType } from "@typegoose/typegoose";
import { User, UserModel } from "@models/User";
import { InternalRoles } from "@models/BotRoles";
import { CouldNotFindRoleError, CouldNotAssignRoleError } from "@types";
import { Guild as DatabaseGuild } from "@models/Guild";

/**
 * Manages user-related operations such as retrieving users, creating new users, and assigning roles to users.
 */
@injectable()
@singleton()
export default class UserManager {
    protected app: Application;
    
    /**
     * Constructs a new instance of the UserManager class.
     * @param app The application instance.
     */
    constructor(@inject(delay(() => Application)) app: Application) {
        this.app = app;
    }

    /**
     * Retrieves a user from the database based on the provided Discord user.
     * If the user does not exist, a new user will be created and returned.
     * @param user The Discord user.
     * @returns A Promise that resolves to the retrieved or created user.
     */
    public async getUser(user: DiscordUser): Promise<DocumentType<User>> {
        var userModel = await UserModel.findById(user.id);
        if (!userModel) {
            this.app.logger.debug(`User "${user.tag}" (id: ${user.id}) does not exist. Creating...`)
            return await this.getDefaultUser(user);
        }
        this.app.logger.debug(`User "${user.tag}" (id: ${user.id}) already exists.`)
        return userModel;
    }

    /**
     * Creates a new user in the database based on the provided Discord user.
     * @param user The Discord user.
     * @returns A Promise that resolves to the created user.
     */
    public async getDefaultUser(user: DiscordUser): Promise<DocumentType<User>> {
        const newUser = new UserModel({
            _id: user.id,
        });
        await newUser.save();
        this.app.logger.info(`Created new User "${user.tag}" (id: ${user.id})`);
        return newUser;
    }

    /**
     * Assigns a role to a user in a guild.
     * @param dbGuild The database guild.
     * @param user The Discord user.
     * @param roleName The internal name of the role to assign.
     * @throws {CouldNotFindRoleError} if the specified role cannot be found in the guild.
     * @throws {CouldNotAssignRoleError} if the role cannot be assigned to the user.
     */
    public async assignRoleToUser(dbGuild: DocumentType<DatabaseGuild>, user: DiscordUser, roleName: InternalRoles): Promise<void> {
        const dbActiveSessionRole = dbGuild.guild_settings.roles?.find(role => role.internal_name == roleName);
        if (!dbActiveSessionRole) {
            this.app.logger.info(`Role "${roleName}" not found in guild "${dbGuild.name}" (id: ${dbGuild._id})`);
            throw new CouldNotFindRoleError(roleName);
        }
        const guild = this.app.client.guilds.resolve(dbGuild._id)!;
        const role = guild.roles.resolve(dbActiveSessionRole.role_id!);
        const member = guild.members.resolve(user);
        if (role && member && !member.roles.cache.has(role.id)) {
            await member.roles.add(role);
            this.app.logger.info(`Assigned role "${role.name}" to user "${user.tag}" (id: ${user.id})`);
        } else {
            this.app.logger.info(`Could not assign role "${roleName}" to user "${user.tag}" (id: ${user.id})`);
            throw new CouldNotAssignRoleError(roleName, user);
        }
    }
}