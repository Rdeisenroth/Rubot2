import { ApplicationCommandOptionType, BaseMessageOptions, ChatInputCommandInteraction, EmbedBuilder, PermissionsBitField, Role, RoleCreateOptions } from "discord.js";
import { MockDiscord } from "@tests/mockDiscord";
import UpdateBotRolesCommand from "./UpdateBotRolesCommand";
import { container } from "tsyringe";
import { mockRole } from "@shoginn/discordjs-mock";
import { InternalGuildRoles } from "@models/BotRoles";
import { GuildModel } from "@models/Guild";

describe("UpdateBotRolesCommand", () => {
    const command = UpdateBotRolesCommand
    const discord = container.resolve(MockDiscord)
    let commandInstance: UpdateBotRolesCommand
    let interaction: ChatInputCommandInteraction
    let roles: Array<Role> = []

    beforeEach(() => {
        interaction = discord.mockInteraction()
        const app = discord.getApplication()
        interaction.guild!.roles.create = jest.fn().mockImplementation(async (role: RoleCreateOptions) => {
            app.logger.debug(`Creating role ${role.name}`)
            const newRole = mockRole(app.client, PermissionsBitField.Default, interaction.guild!, { name: role.name, id: `${role.name}_id_${interaction.guild!.id}` })
            roles.push(newRole)
            return newRole
        })
        interaction.guild!.roles.resolve = jest.fn().mockImplementation((roleId: string) => {
            app.logger.debug(`Resolving role ${roleId}`)
            return roles.find((role) => role.id === roleId)
        })
        commandInstance = new command(interaction, discord.getApplication())
    })

    it("should have the correct name", () => {
        expect(command.name).toBe("updatebotroles")
    })

    it("should have the correct description", () => {
        expect(command.description).toBe("Creates or updates the database entries for the internal roles")
    })

    it("should have one option", () => {
        expect(command.options).toHaveLength(1)
    })

    it("should have the correct option", () => {
        expect(command.options[0]).toStrictEqual({
            name: "create-if-not-exists",
            description: "Create the Roles on the guild with the default name if they don't exist, defaults to true",
            type: ApplicationCommandOptionType.Boolean,
            required: false,
            default: true,
        })
    })

    it("should create the discord roles if they don't exist and option is true", async () => {
        await commandInstance.execute()

        expect(interaction.guild!.roles.create).toHaveBeenCalledTimes(InternalGuildRoles.length)
        for (const internalRole of InternalGuildRoles) {
            expect(interaction.guild!.roles.create).toHaveBeenCalledWith({
                name: internalRole,
                mentionable: false,
            })
        }
    })

    it("should not create the discord roles if they don't exist and option is false", async () => {
        const dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)

        interaction.options.get = jest.fn().mockImplementation((option: string) => {
            switch (option) {
                case "create-if-not-exists":
                    return { value: false }
                default:
                    return null
            }
        })
        await commandInstance.execute()

        expect(interaction.guild!.roles.create).not.toHaveBeenCalled()
        expect(dbGuild.guild_settings.roles).toHaveLength(0)
    })

    it("should create the database entries if they don't exist", async () => {
        let dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)
        await commandInstance.execute()
        dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)

        expect(dbGuild.guild_settings.roles).toHaveLength(InternalGuildRoles.length)
        for (const internalRole of InternalGuildRoles) {
            expect(dbGuild.guild_settings.roles).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        internal_name: internalRole,
                        role_id: `${internalRole}_id_${interaction.guild!.id}`,
                        scope: "server",
                        server_id: interaction.guild!.id,
                        server_role_name: internalRole,
                    })
                ])
            )
        }
    })

    it("should update the database if the discord role name changed", async () => {
        let dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)
        // create the roles 
        for (const internalRole of InternalGuildRoles) {
            // create the role on the server
            const role = await interaction.guild!.roles.create({
                name: internalRole,
                mentionable: false,
            })
            // create the role in the db
            dbGuild.guild_settings.roles?.push({
                internal_name: internalRole,
                role_id: role.id,
                scope: "server",
                server_id: interaction.guild!.id,
                server_role_name: role.name,
            })
            // change the role name
            roles.find((r) => r.id === role.id)!.name = `${internalRole}_changed`
        }
        await dbGuild.save()

        await commandInstance.execute()
        dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)

        expect(dbGuild.guild_settings.roles).toHaveLength(InternalGuildRoles.length)
        for (const internalRole of InternalGuildRoles) {
            expect(dbGuild.guild_settings.roles).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        internal_name: internalRole,
                        role_id: `${internalRole}_id_${interaction.guild!.id}`,
                        scope: "server",
                        server_id: interaction.guild!.id,
                        server_role_name: `${internalRole}_changed`,
                    })
                ])
            )
        }
    })

    it("should find the discord role by id if the name is different to the internal name", async () => {
        let dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)
        // create the roles 
        for (const internalRole of InternalGuildRoles) {
            // create the role on the server
            const role = await interaction.guild!.roles.create({
                name: `${internalRole}_changed`,
                mentionable: false,
            })
            // create the role in the db
            dbGuild.guild_settings.roles?.push({
                internal_name: internalRole,
                role_id: role.id,
                scope: "server",
                server_id: interaction.guild!.id,
                server_role_name: role.name,
            })
        }
        await dbGuild.save()

        await commandInstance.execute()
        dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)

        expect(dbGuild.guild_settings.roles).toHaveLength(InternalGuildRoles.length)
        for (const internalRole of InternalGuildRoles) {
            expect(dbGuild.guild_settings.roles).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        _id: expect.anything(),
                        internal_name: internalRole,
                        role_id: `${internalRole}_changed_id_${interaction.guild!.id}`,
                        scope: "server",
                        server_id: interaction.guild!.id,
                        server_role_name: `${internalRole}_changed`,
                    })
                ])
            )
        }
    });

    it("should not update the database if the discord role name is the same", async () => {
        let dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)
        // create the roles 
        for (const internalRole of InternalGuildRoles) {
            // create the role on the server
            const role = await interaction.guild!.roles.create({
                name: `${internalRole}_changed`,
                mentionable: false,
            })
            // create the role in the db
            dbGuild.guild_settings.roles?.push({
                internal_name: internalRole,
                role_id: role.id,
                scope: "server",
                server_id: interaction.guild!.id,
                server_role_name: role.name,
            })
        }
        await dbGuild.save()

        const guildSaveSpy = jest.spyOn(GuildModel.prototype, 'save')
        await commandInstance.execute()
        dbGuild = await discord.getApplication().configManager.getGuildConfig(interaction.guild!)

        // check db was not updated
        expect(guildSaveSpy).not.toHaveBeenCalled()
    })

    it("should defer the reply", async () => {
        const deferSpy = jest.spyOn(interaction, 'deferReply')
        await commandInstance.execute()

        expect(deferSpy).toHaveBeenCalled()
    })

    it("should edit the deferred reply with an embed with the roles", async () => {
        const replySpy = jest.spyOn(interaction, 'editReply')
        await commandInstance.execute()

        expect(replySpy).toHaveBeenCalledWith({ embeds: expect.anything() })
        const messageContent = replySpy.mock.calls[0][0] as BaseMessageOptions
        expect(messageContent.embeds).toBeDefined()
        const embeds = messageContent.embeds as EmbedBuilder[]
        expect(embeds).toHaveLength(1)
        const embed = embeds[0]
        const embedData = embed.data
        expect(embedData.title).toBe("Administration")
        expect(embedData.description).toContain("Done generating internal Roles. Internal Roles:")
        expect(embedData.description).toContain("Unassigned Roles:")
        for (const internalRole of InternalGuildRoles) {
            expect(embedData.description).toContain(internalRole)
        }
    })
});
