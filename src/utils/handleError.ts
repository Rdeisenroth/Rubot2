import { ConsolaInstance } from "consola"
import { DMChannel, Interaction } from "discord.js"

/**
 * Handles error on interaction sending.
 * 
 * @param {Error} error
 * @param {object} interaction
 */
export function handleInteractionError(error: Error, interaction: Interaction, logger: ConsolaInstance): void {
    const guildName = interaction.guild?.name ?? 'DM'
    const channelName = interaction.channel instanceof DMChannel ? 'DM' : interaction.channel?.id ?? 'unknown'
    const authorName = interaction.user.username
    const authorTag = interaction.user.tag
    const errorText = error.toString() || ''
    logger.error(`${error.name}: ${interaction.isCommand() && interaction.commandName} on guild "${guildName}", channel "${channelName}" by ${authorName}(${authorTag})\n ${error} \n ${error.stack}`)
    if (errorText.includes('TypeError') || errorText.includes('RangeError')) {
        logger.error(error)
    }
}
