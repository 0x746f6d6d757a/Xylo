import { ActionRowBuilder, MessageFlags, ButtonBuilder, ButtonStyle } from 'discord.js'
import { getLoggerSettingsButtons, getNavigationButtons, getTopicEventCategoryMenu, getChannelFields, getEventToggleMenu, getCategoryActionMenu } from './buttonsCreation.js'
import { loggerChannelsSettingsEmbed, loggerSettingsEmbed, categoryManagementEventListEmbed } from './embedCreation.js'

/**
 * Sends the logger panel to the user.
 * @param {import("discord.js").Interaction} interaction
 * @param {import("discord.js").Client} client
 * @param {Object} configSettings
 */
export function sendLoggerPanel(interaction, client, configSettings) {

    const loggerEmbed = loggerSettingsEmbed(configSettings, client)
    const { toggleButton, changeLevelButton, openManagementEventsButton, createLogChannelsForLevelButton } = getLoggerSettingsButtons(configSettings, interaction)
    const { backToMainMenuButton } = getNavigationButtons(interaction, false) // Don't show logger back button

    const firstComponentRow = new ActionRowBuilder()
        .addComponents(toggleButton, changeLevelButton, openManagementEventsButton, createLogChannelsForLevelButton)
    
    const secondComponentRow = new ActionRowBuilder()
        .addComponents(backToMainMenuButton)

    if(interaction.replied || interaction.deferred) {
        interaction.editReply({ embeds: [loggerEmbed], components: [firstComponentRow, secondComponentRow] })
    } else {
        interaction.update({ embeds: [loggerEmbed], components: [firstComponentRow, secondComponentRow], flags: MessageFlags.Ephemeral })
    }

}


/**
 * Sends the logger channel settings panel to the user.
 * @param {import("discord.js").Interaction} interaction
 * @param {import("discord.js").Client} client
 * @param {Object} configSettings
 */
export function sendLoggerChannelSettingsPanel(interaction, client, configSettings) {

    const channelFields = getChannelFields(configSettings)

    const loggerEmbed = loggerChannelsSettingsEmbed(client, channelFields)
    const topicEventCategoryMenu = getTopicEventCategoryMenu(configSettings, interaction)
    const { backToMainMenuButton, backToLoggerMenuButton } = getNavigationButtons(interaction, true) // Show logger back button

    const firstComponentRow = new ActionRowBuilder()
        .addComponents(topicEventCategoryMenu)

    const secondComponentRow = new ActionRowBuilder()
        .addComponents(backToMainMenuButton, backToLoggerMenuButton)

    if(interaction.replied || interaction.deferred) {
        interaction.editReply({ embeds: [loggerEmbed], components: [firstComponentRow, secondComponentRow] })
    } else {
        interaction.update({ embeds: [loggerEmbed], components: [firstComponentRow, secondComponentRow], flags: MessageFlags.Ephemeral })
    }
}

/**
 * Sends the category event management panel showing all events for a specific category
 * @param {import("discord.js").Interaction} interaction
 * @param {import("discord.js").Client} client
 * @param {Object} configSettings
 * @param {string} categoryKey - The category key (e.g., "automod", "members")
 */
export function sendCategoryEventManagementPanel(interaction, client, configSettings, categoryKey) {

    const categoryData = configSettings.channels[categoryKey]
    if (!categoryData) return interaction.reply({ content: "Category not found.", flags: MessageFlags.Ephemeral })

    const eventEmbed = categoryManagementEventListEmbed(categoryKey, categoryData, client, interaction)
    const eventToggleMenu = getEventToggleMenu(categoryKey, categoryData, interaction)
    
    const backButton = new ButtonBuilder()
        .setCustomId(`loggerSystem|${interaction.guildId}|manageChannels`)
        .setLabel('Back to Categories')
        .setStyle(ButtonStyle.Secondary)

    const firstComponentRow = new ActionRowBuilder()
        .addComponents(eventToggleMenu)

    const secondComponentRow = new ActionRowBuilder()
        .addComponents(backButton)

    if(interaction.replied || interaction.deferred) {
        interaction.editReply({ embeds: [eventEmbed], components: [firstComponentRow, secondComponentRow] })
    } else {
        interaction.update({ embeds: [eventEmbed], components: [firstComponentRow, secondComponentRow], flags: MessageFlags.Ephemeral })
    }
}

/**
 * Sends the category action menu panel
 * @param {import("discord.js").Interaction} interaction
 * @param {import("discord.js").Client} client
 * @param {Object} configSettings
 * @param {string} categoryKey
 */
export function sendCategoryActionPanel(interaction, client, configSettings, categoryKey) {

    const categoryData = configSettings.channels[categoryKey]
    if (!categoryData) return interaction.reply({ content: "Category not found.", flags: MessageFlags.Ephemeral })

    const channelFields = getChannelFields(configSettings)
    const loggerEmbed = loggerChannelsSettingsEmbed(client, channelFields)
    
    const topicEventCategoryMenu = getTopicEventCategoryMenu(configSettings, interaction)
    topicEventCategoryMenu.options.forEach(option => { 
        option.data.default = option.data.value === categoryKey 
    })

    const actionSelectMenu = getCategoryActionMenu(categoryKey, categoryData, interaction)
    const { backToMainMenuButton, backToLoggerMenuButton } = getNavigationButtons(interaction, true)

    const firstSelectRow = new ActionRowBuilder().addComponents(topicEventCategoryMenu)
    const secondSelectRow = new ActionRowBuilder().addComponents(actionSelectMenu)
    const navigationRow = new ActionRowBuilder().addComponents(backToMainMenuButton, backToLoggerMenuButton)

    if(interaction.replied || interaction.deferred) {
        interaction.editReply({ embeds: [loggerEmbed], components: [firstSelectRow, secondSelectRow, navigationRow] })
    } else {
        interaction.update({ embeds: [loggerEmbed], components: [firstSelectRow, secondSelectRow, navigationRow], flags: MessageFlags.Ephemeral })
    }
}