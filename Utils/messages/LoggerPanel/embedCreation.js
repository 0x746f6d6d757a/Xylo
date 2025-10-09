import { EmbedBuilder } from 'discord.js'
import { camelCaseToTitle } from '../stringParser.js'

export function loggerSettingsEmbed(configSettings, client) {

    return new EmbedBuilder()
        .setTitle('Logger System Settings')
        .setDescription('Configure the logging settings for your guild using the buttons below.')
        .addFields(
            { name: 'Status', value: configSettings.enabled ? 'Enabled' : 'Disabled', inline: true },
            { name: 'Logging Level', value: `${configSettings.loggingLevel}`, inline: true }, 
        )
        .setColor(0x5865F2)
        .setFooter({ text: client.developer.footerText, iconURL: client.developer.icon })
        .setTimestamp()
    
}

/**
 * 
 * @param {import("discord.js").Client} client 
 * @param {Array} channelFields 
 * @returns {EmbedBuilder}
 */
export function loggerChannelsSettingsEmbed(client, channelFields) {

    return new EmbedBuilder()
        .setTitle('Manage Logging Channels')
        .setDescription('Select a category to configure with the menu below.')
        .addFields(channelFields)
        .setColor(0x5865F2)
        .setFooter({ text: client.developer.footerText, iconURL: client.developer.icon })
        .setTimestamp()

}

/**
 * Creates an embed showing all events for a specific category
 * @param {string} categoryKey
 * @param {Object} categoryData
 * @param {import("discord.js").Client} client 
 * @param {import("discord.js").Interaction} interaction
 * @returns {EmbedBuilder}
 */
export function categoryManagementEventListEmbed(categoryKey, categoryData, client, interaction) {

    const { enabled, channelId, events } = categoryData
    
    const eventFields = []
    for (const [eventName, eventData] of Object.entries(events)) {
        eventFields.push({
            name: `${eventData.enabled ? '🟢' : '🔴'} ${eventName}`,
            value: eventData.enabled ? 'Currently enabled' : 'Currently disabled',
            inline: false
        })
    }

    const enabledCount = Object.entries(events).filter(([_, eventData]) => eventData.enabled).length
    const totalCount = Object.keys(events).length

    return new EmbedBuilder()
        .setTitle(`${camelCaseToTitle(categoryKey)} Events`)
        .setDescription(`Category Status: ${enabled ? '**Enabled** 🟢' : '**Disabled** 🔴'}\nLogging Channel: ${channelId ? `<#${channelId}>` : '**Not Set**'}\n\nSelect an event from the menu below to toggle it on or off.\n\n**Events Enabled:** ${enabledCount}/${totalCount}`)
        .addFields(eventFields)
        .setColor(enabled ? 0x57F287 : 0xED4245)
        .setFooter({ text: client.developer.footerText, iconURL: client.developer.icon })
        .setTimestamp()

}
