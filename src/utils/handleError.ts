import { DMChannel, Interaction } from "discord.js"

/**
 * Handles error on interaction sending.
 *
 * @param {Error} error
 * @param {object} message
 */
export function handleInteractionError(error: Error, interaction: Interaction): void {
    const guildName = interaction.guild?.name ?? 'DM'
    const channelName = interaction.channel instanceof DMChannel ? 'DM' : interaction.channel?.id ?? 'unknown'
    const authorName = interaction.user.username
    const authorTag = interaction.user.tag
    const errorText = error.toString() || ''
    console.log(`${error.name}: ${interaction.isCommand() && interaction.commandName} on guild "${guildName}", channel "${channelName}" by ${authorName}(${authorTag})`)
    if (errorText.includes('TypeError') || errorText.includes('RangeError')) {
        console.log(error)
    }
}
