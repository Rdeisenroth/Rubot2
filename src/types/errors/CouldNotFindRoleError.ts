export default class CouldNotFindRoleError extends Error {
    /**
     * The id of the role which could not be found.
     */
    public roleId: string

    /**
     * Creates a new could not find role error.
     * @param roleId The id of the role which could not be found.
     */
    constructor(roleId: string) {
        super(`Could not find role "${roleId}".`)
        this.roleId = roleId
    }
}