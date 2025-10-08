import { Client, Events, MessageFlags, ModalSubmitInteraction } from "discord.js"
import { parseCustomId } from "../../Utils/messages/stringParser.js"
import { updateGuildConfig } from "../../Utils/database/databaseManager.js"
import { sendChannelManagementPanel, sendLoggerPanel } from "../../Utils/messages/Panels/loggerPanel.js"

export default {
    name: Events.InteractionCreate,
    /**
     * @param {ModalSubmitInteraction} interaction 
     * @param {Client} client
     */
    async execute(interaction, client) {
        if (!interaction.isModalSubmit()) return

        let extraPart = null
        const { customId, fields } = interaction
        let { guildId, selectedSystem, selectedAction } = parseCustomId(customId)
        if(selectedAction.includes('_')) [selectedAction, extraPart] = selectedAction.split('_')

        // Ensure the interaction is for the correct guild
        if (guildId !== interaction.guildId) return interaction.reply({ content: "This interaction does not belong to this guild.", flags: MessageFlags.Ephemeral })

        let guildSettings = client.guildConfigs.get(guildId) || []
        if (!guildSettings || guildSettings.length === 0) return interaction.reply({ content: "Guild settings could not be found. Please contact support.", flags: MessageFlags.Ephemeral })

        let configToEdit = guildSettings.find(config => config.configType === selectedSystem)
        if (!configToEdit) return interaction.reply({ content: "Selected configuration could not be found. Please contact support.", flags: MessageFlags.Ephemeral })

        let configSettings = typeof configToEdit.configSettings === 'string' ? JSON.parse(configToEdit.configSettings) : configToEdit.configSettings

        switch (selectedSystem) {
            case 'loggerSystem':
                switch (selectedAction) {
                    case 'changeLevelModal':
                        const loggingLevelInput = interaction.fields.getTextInputValue('loggingLevelInput')
                        const newLevel = parseInt(loggingLevelInput)
                        if (isNaN(newLevel) || newLevel < 1 || newLevel > 3) return interaction.reply({ content: "Invalid logging level. Please enter a level between 1 and 3.", flags: MessageFlags.Ephemeral })

                        configSettings.loggingLevel = newLevel
                        updateGuildConfig(client, guildId, selectedSystem, configSettings)
                        return await sendLoggerPanel(configSettings, interaction, client)
                    
                    case 'changeRoleModal':
                        const adminRoleInputId = interaction.fields.getTextInputValue('adminRoleInput').trim()
                        const adminRole = interaction.guild.roles.cache.get(adminRoleInputId)
                        if (!adminRole) return interaction.reply({ content: "Invalid role ID. Please enter a valid role ID from this server.", flags: MessageFlags.Ephemeral })

                        configSettings.adminRole = adminRole.id
                        await updateGuildConfig(client, guildId, selectedSystem, configSettings)
                        return await sendLoggerPanel(configSettings, interaction, client)

                    case 'changeCategoryModal':
                        const categoryInputId = interaction.fields.getTextInputValue('categoryInput').trim()
                        const categoryChannel = interaction.guild.channels.cache.get(categoryInputId)
                        if (!categoryChannel || categoryChannel.type !== 4) return interaction.reply({ content: "Invalid category ID. Please enter a valid category ID from this server.", flags: MessageFlags.Ephemeral })

                        configSettings.categoryParentID = categoryChannel.id
                        updateGuildConfig(client, guildId, selectedSystem, configSettings)
                        return await sendLoggerPanel(configSettings, interaction, client)

                    case 'setChannelModal':
                        if (!extraPart) return interaction.reply({ content: "No event specified for setting channel.", flags: MessageFlags.Ephemeral })
                        
                        const channelInputId = interaction.fields.getTextInputValue('channelInput').trim()
                        const logChannel = interaction.guild.channels.cache.get(channelInputId)
                        if (!logChannel || logChannel.type !== 0) return interaction.reply({ content: "Invalid channel ID. Please enter a valid text channel ID from this server.", flags: MessageFlags.Ephemeral })
                        
                        let eventFound = false
                        for (const [categoryKey, categoryEvents] of Object.entries(configSettings.channels)) {
                            if (categoryEvents && typeof categoryEvents === 'object') {
                                for (const [eventName, channelId] of Object.entries(categoryEvents)) {
                                    if (eventName === extraPart) {
                                        configSettings.channels[categoryKey][eventName] = logChannel.id
                                        eventFound = true
                                        break
                                    }
                                }
                            }
                            if (eventFound) break
                        }
                        
                        if (!eventFound) return interaction.reply({ content: "Event not found in configuration.", flags: MessageFlags.Ephemeral })
                        
                        configToEdit.configSettings = configSettings
                        updateGuildConfig(client, guildId, selectedSystem, configSettings)
                        return await sendChannelManagementPanel(configSettings, interaction, client)

                    default:
                        return interaction.reply({ content: "Unknown action for logger system.", flags: MessageFlags.Ephemeral })

                }
            default:
                return interaction.reply({ content: "Unknown configuration system.", flags: MessageFlags.Ephemeral })
        }

        

    }
}
