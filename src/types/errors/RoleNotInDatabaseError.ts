import { Role } from "discord.js"

export default class RoleNotInDatabaseError extends Error {
    public role: Role

    constructor(role: Role) {
        super(`Role "${role.name}" is not in the database.`)
        this.role = role
    }
}