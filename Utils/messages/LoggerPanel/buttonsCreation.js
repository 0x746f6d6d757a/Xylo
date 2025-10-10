import { ButtonBuilder, StringSelectMenuBuilder, ButtonStyle } from "discord.js";
import { camelCaseToTitle } from "../stringParser.js";

/**
 * @param {import("discord.js").Interaction} interaction 
 * @param {boolean} showLoggerBackButton
 * @returns { backToMainMenuButton: ButtonBuilder, backToLoggerMenuButton?: ButtonBuilder }
 */
export function getNavigationButtons(interaction, showLoggerBackButton = false) {

    const backToMainMenuButton = new ButtonBuilder()
        .setCustomId(`changeSettings|${interaction.guildId}|mainMenu`)
        .setLabel('Back to Main Menu')
        .setStyle(ButtonStyle.Secondary)

    const buttons = { backToMainMenuButton }

    if (showLoggerBackButton) {
        buttons.backToLoggerMenuButton = new ButtonBuilder()
            .setCustomId(`loggerSystem|${interaction.guildId}|mainMenu`)
            .setLabel('Back to Logger Menu')
            .setStyle(ButtonStyle.Secondary)
    }

    return buttons

}

/**
 * @param {Object} configSettings 
 * @param {import("discord.js").Interaction} interaction 
 * @returns { toggleButton: ButtonBuilder, changeLevelButton: ButtonBuilder, openManagementEventsButton: ButtonBuilder }
 */
export function getLoggerSettingsButtons(configSettings, interaction) {

    const toggleButton = new ButtonBuilder()
        .setCustomId(`loggerSystem|${interaction.guildId}|toggle`)
        .setLabel(configSettings.enabled ? 'Disable Logger' : 'Enable Logger')
        .setStyle(ButtonStyle.Secondary)

    const changeLevelButton = new ButtonBuilder()
        .setCustomId(`loggerSystem|${interaction.guildId}|changeLevel`)
        .setLabel('Change Logging Level')
        .setStyle(ButtonStyle.Secondary)

    const openManagementEventsButton = new ButtonBuilder()
        .setCustomId(`loggerSystem|${interaction.guildId}|manageChannels`)
        .setLabel('Manage Channels')
        .setStyle(ButtonStyle.Secondary)

    const createLogChannelsForLevelButton = new ButtonBuilder()
        .setCustomId(`loggerSystem|${interaction.guildId}|createChannels`)
        .setLabel(`Create channels`)
        .setStyle(ButtonStyle.Secondary)

    return { toggleButton, changeLevelButton, openManagementEventsButton, createLogChannelsForLevelButton }

}

export function getChannelFields(configSettings) {

    const fields = []
    for (const [eventCategory, categoryData] of Object.entries(configSettings.channels)) {

        const { enabled, channelId, events } = categoryData

        const enabledEvents = Object.entries(events).filter(([_, eventData]) => eventData.enabled).length
        const totalEvents = Object.keys(events).length

        fields.push({
            name: `${camelCaseToTitle(eventCategory)} - ${enabled ? '🟢 Enabled' : '🔴 Disabled'}`,
            value: `Channel: ${channelId ? `<#${channelId}>` : '*Not Set*'}\nEnabled: ${enabledEvents}/${totalEvents} events`,
            inline: false
        })
    }

    return fields

}

export function getTopicEventCategoryMenu(configSettings, interaction) {

    const selectMenuOptions = []
    for( const [eventCategory, categoryData] of Object.entries(configSettings.channels)) {
        const { enabled, channelId, events } = categoryData
        
        const totalEvents = Object.keys(events).length
        const enabledEvents = Object.entries(events).filter(([_, eventData]) => eventData.enabled).length
        
        selectMenuOptions.push({
            label: `${camelCaseToTitle(eventCategory)}`,
            description: `${enabledEvents}/${totalEvents} events enabled - Channel: ${channelId ? 'Set' : 'Not Set'}`,
            value: eventCategory,
            emoji: enabled ? '🟢' : '🔴'
        })
    }

    const topicEventSelectMenu = new StringSelectMenuBuilder()
        .setCustomId(`loggerSystem|${interaction.guildId}|selectCategory`)
        .setPlaceholder('Select a category to configure')
        .addOptions(selectMenuOptions.slice(0, 25))

    return topicEventSelectMenu
}

/**
 * Creates a select menu for toggling individual events in a category
 * @param {string} categoryKey
 * @param {Object} categoryData
 * @param {import("discord.js").Interaction} interaction 
 * @returns {StringSelectMenuBuilder}
 */
export function getEventToggleMenu(categoryKey, categoryData, interaction) {
    
    const { events } = categoryData
    const eventOptions = []

    for (const [eventName, eventData] of Object.entries(events)) {
        eventOptions.push({
            label: eventName,
            description: eventData.enabled ? 'Click to disable' : 'Click to enable',
            value: eventName,
            emoji: eventData.enabled ? '🟢' : '🔴'
        })
    }

    return new StringSelectMenuBuilder()
        .setCustomId(`loggerSystem|${interaction.guildId}|selectEvent_${categoryKey}`)
        .setPlaceholder('Select an event to toggle')
        .addOptions(eventOptions.slice(0, 25))
}

/**
 * Creates the category action select menu
 * @param {string} categoryKey
 * @param {Object} categoryData
 * @param {import("discord.js").Interaction} interaction 
 * @returns {StringSelectMenuBuilder}
 */
export function getCategoryActionMenu(categoryKey, categoryData, interaction) {
    return new StringSelectMenuBuilder()
        .setCustomId(`loggerSystem|${interaction.guildId}|selectCategoryAction_${categoryKey}`)
        .setPlaceholder('Choose an action...')
        .addOptions([
            {
                label: 'Toggle Category',
                description: `${categoryData.enabled ? 'Disable' : 'Enable'} this category`,
                value: 'toggleCategory',
                emoji: categoryData.enabled ? '🔴' : '🟢'
            },
            {
                label: 'Set Channel',
                description: 'Set the logging channel for this category',
                value: 'setChannel',
                emoji: '📝'
            },
            {
                label: 'Manage Events',
                description: 'Enable/disable individual events',
                value: 'manageEvents',
                emoji: '⚙️'
            }
        ])
}

