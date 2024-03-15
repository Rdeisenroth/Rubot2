import { User } from "discord.js";

/**
 * Represents an error that occurs when a role cannot be assigned to a user.
 */
export default class CouldNotAssignRoleError extends Error {
    /*
     * The name of the role that could not be assigned to the user.
     */
    public roleName: string;

    /*
     * The user that could not be assigned the role.
     */
    public user: User;

    /**
     * Creates a new instance of CouldNotAssignRoleError.
     * 
     * @param roleName The name of the role that could not be assigned to the user.
     * @param user The user that could not be assigned the role.
     */
    constructor(roleName: string, user: User) {
        super(`Could not assign role: ${roleName} to user: ${user.tag}`);
        this.roleName = roleName;
        this.user = user;
    }
}