import { ActionRowBuilder, MessageFlags } from "discord.js"
import { getSettingsEmbed } from './embedCreation.js'
import { getTopicEventCategoryMenu } from './buttonCreation.js'

/**
 * Sends the guild settings menu
 * @param {import('discord.js').Interaction} interaction 
 * @param {Client} client 
 */
export async function sendSettingsMenu(interaction, client, guildSettings) {

    const embedMenu = getSettingsEmbed(interaction, client)
    const stringSelectMenu = getTopicEventCategoryMenu(guildSettings, interaction)

    const actionRow = new ActionRowBuilder()
        .addComponents(stringSelectMenu)

    if(interaction.replied || interaction.deferred) {
        return interaction.editReply({ embeds: [embedMenu], components: [actionRow], flags: MessageFlags.Ephemeral })
    } else {
        return interaction.update({ embeds: [embedMenu], components: [actionRow], flags: MessageFlags.Ephemeral })
    }
}