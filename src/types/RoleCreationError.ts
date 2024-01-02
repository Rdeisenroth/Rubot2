export class RoleCreationError extends Error {
    constructor(roleName: string, guildName: string) {
        super(`Role Creation Error: Role "${roleName}" could not be created on guild "${guildName}"`);
    }
}