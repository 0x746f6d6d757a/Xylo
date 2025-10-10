import { Client, Events, MessageFlags, ModalSubmitInteraction } from "discord.js"
import { parseCustomId } from "../../Utils/messages/stringParser.js"
import { updateGuildConfig } from "../../Utils/database/databaseManager.js"
import { sendLoggerPanel, sendCategoryActionPanel } from "../../Utils/messages/LoggerPanel/sendPanel.js"

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
                        return sendLoggerPanel(interaction, client, configSettings)

                    case 'setCategoryChannelModal':
                        if (!extraPart) return interaction.reply({ content: "No category specified.", flags: MessageFlags.Ephemeral })
                        
                        const channelInputId = interaction.fields.getTextInputValue('channelInput').trim()
                        const logChannel = interaction.guild.channels.cache.get(channelInputId)
                        if (!logChannel || logChannel.type !== 0) return interaction.reply({ content: "Invalid channel ID. Please enter a valid text channel ID from this server.", flags: MessageFlags.Ephemeral })
                        
                        const category = configSettings.channels[extraPart]
                        if (!category) return interaction.reply({ content: "Category not found in configuration.", flags: MessageFlags.Ephemeral })
                        
                        category.channelId = logChannel.id
                        
                        configToEdit.configSettings = configSettings
                        updateGuildConfig(client, guildId, selectedSystem, configSettings)
                        
                        return sendCategoryActionPanel(interaction, client, configSettings, extraPart)

                    default:
                        return interaction.reply({ content: "Unknown action for logger system.", flags: MessageFlags.Ephemeral })

                }
            default:
                return interaction.reply({ content: "Unknown configuration system.", flags: MessageFlags.Ephemeral })
        }
    }
}
