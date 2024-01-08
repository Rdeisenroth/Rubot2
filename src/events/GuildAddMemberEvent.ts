import { BaseEvent } from "@baseEvent";
import { Guild as DatabaseGuild } from "@models/Guild";
import { EmbedBuilder, GuildMember } from "discord.js";
import { DocumentType } from "@typegoose/typegoose";
import { StringReplacements } from "src/types/StringReplacements";
import { interpolateString } from "@utils/interpolateString";

export default class GuildAddMemberEvent extends BaseEvent {
    public static name = "guildMemberAdd";

    /**
     * The guild saved in the database.
     */
    private dbGuild!: DocumentType<DatabaseGuild>;

    public async execute(member: GuildMember) {
        this.app.logger.info(`Member ${member.user.tag} (id: ${member.id}) joined guild "${member.guild.name}" (id: ${member.guild.id})`)
        this.dbGuild = await this.app.configManager.getGuildConfig(member.guild)
        await this.app.userManager.getUser(member.user)
        
        await this.sendWelcomeMessage(member)
    }

    private async sendWelcomeMessage(member: GuildMember) {
        if (!this.dbGuild.welcome_text) return;

        const guild = member.guild;

        try {
            const replacements: StringReplacements = {
                "guild_name": guild.name,
                "member": member,
                "member_count": guild.memberCount,
                "guild_owner": await guild.fetchOwner(),
            };
            const title = interpolateString(this.dbGuild.welcome_title ?? "Welcome to ${name}", replacements);
            const text = interpolateString(this.dbGuild.welcome_text, replacements);

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(text)
            await member.send({ embeds: [embed] })
        } catch (error) {
            this.app.logger.error(error)
        }
    }
}