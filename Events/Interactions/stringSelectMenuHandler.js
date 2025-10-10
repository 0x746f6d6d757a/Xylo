import { ActionRowBuilder, ButtonBuilder, Events, MessageFlags, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, TextInputBuilder, TextInputStyle } from "discord.js"
import { parseCustomId } from "../../Utils/messages/stringParser.js"
import { sendLoggerPanel, sendLoggerChannelSettingsPanel, sendCategoryEventManagementPanel, sendCategoryActionPanel } from "../../Utils/messages/LoggerPanel/sendPanel.js"
import { updateGuildConfig } from "../../Utils/database/databaseManager.js"
import { getCategoryActionMenu } from "../../Utils/messages/LoggerPanel/buttonsCreation.js"


export default {
    name: Events.InteractionCreate,
    /**
     * @param {StringSelectMenuInteraction} interaction 
     * @param {Client} client
     */
    async execute(interaction, client) {
        if (!interaction.isStringSelectMenu()) return

        let extraPart = null
        const { customId, values, message } = interaction
        let { guildId, selectedSystem, selectedAction, extraData } = parseCustomId(customId)
        if(selectedAction.includes('_')) [selectedAction, extraPart] = selectedAction.split('_')

        const selectedValue = values[0]

        if (guildId !== interaction.guildId) return interaction.reply({ content: "This interaction does not belong to this guild.", flags: MessageFlags.Ephemeral })
        
        switch (selectedSystem) {
            case 'changeSettings':
            
                switch (selectedAction) {

                    case 'select':
                        const guildSettings = client.guildConfigs.get(guildId) || {}
                        if (!guildSettings || Object.keys(guildSettings).length === 0) return interaction.update({ content: "Guild settings could not be found. Please contact support.", embeds: [], components: [] })

                        let configToEdit = guildSettings.find(config => config.configType === selectedValue)
                        if (!configToEdit) return interaction.update({ content: "Selected configuration could not be found. Please contact support.", embeds: [], components: [] })

                        let configSettings = typeof configToEdit.configSettings === 'string' 
                            ? JSON.parse(configToEdit.configSettings) 
                            : configToEdit.configSettings

                        switch (selectedValue) {

                            case 'loggerSystem':
                                return await sendLoggerPanel(interaction, client, configSettings)

                            default:
                                return interaction.update({ content: "This configuration panel is not yet implemented.", embeds: [], components: [] })

                        }

                    default:
                        return interaction.reply({ content: "Unknown action.", flags: MessageFlags.Ephemeral })

                }

            case 'loggerSystem':
                
                const guildSettings = client.guildConfigs.get(guildId) || []
                if (!guildSettings || guildSettings.length === 0) return interaction.reply({ content: "Guild settings could not be found. Please contact support.", flags: MessageFlags.Ephemeral })

                let configToEdit = guildSettings.find(config => config.configType === selectedSystem)
                if (!configToEdit) return interaction.reply({ content: "Selected configuration could not be found. Please contact support.", flags: MessageFlags.Ephemeral })

                let configSettings = typeof configToEdit.configSettings === 'string' ? JSON.parse(configToEdit.configSettings) : configToEdit.configSettings

                switch (selectedAction) {

                    case 'selectCategory':
                        const categoryData = configSettings.channels[selectedValue]
                        if (!categoryData) return interaction.reply({ content: "Category not found.", flags: MessageFlags.Ephemeral })

                        const actionSelectMenu = getCategoryActionMenu(selectedValue, categoryData, interaction)

                        const actionRow = new ActionRowBuilder().addComponents(actionSelectMenu)
                        const originalNavigationButtons = interaction.message.components[1].components.map(component => ButtonBuilder.from(component))
                        const originalMenu = StringSelectMenuBuilder.from(interaction.message.components[0].components[0])

                        originalMenu.options.forEach(option => { option.data.default = option.data.value === selectedValue })

                        const originalSelectRow = new ActionRowBuilder().addComponents(originalMenu)
                        const originalNavigationRow = new ActionRowBuilder().addComponents(...originalNavigationButtons)

                        return await interaction.update({ components: [originalSelectRow, actionRow, originalNavigationRow] })

                    case 'selectCategoryAction':
                        const category = configSettings.channels[extraPart]
                        if (!category) return interaction.reply({ content: "Category not found.", flags: MessageFlags.Ephemeral })

                        switch (selectedValue) {
                            case 'toggleCategory':
                                category.enabled = !category.enabled
                                updateGuildConfig(client, guildId, selectedSystem, configSettings)
                                
                                return sendCategoryActionPanel(interaction, client, configSettings, extraPart)

                            case 'setChannel':
                                const existingChannelId = category.channelId || ''
                                
                                const textInputSetChannel = new TextInputBuilder()
                                    .setCustomId('channelInput')
                                    .setPlaceholder('Enter the logging channel ID for this category')
                                    .setStyle(TextInputStyle.Short)
                                    .setRequired(true)
                                
                                if (existingChannelId) channelInput.setValue(existingChannelId)

                                const labelSetChannel = new LabelBuilder()
                                    .setLabel('Please insert the channel ID.')
                                    .setDescription('Insert the channel id you wish to use.')
                                    .setTextInputComponent(textInputSetChannel)
                                
                                const modalFillInfo = new ModalBuilder()
                                    .setCustomId(`loggerSystem|${guildId}|setCategoryChannelModal_${extraPart}`)
                                    .setTitle(`Set Channel for ${extraPart}`)
                                    .setLabelComponents(labelSetChannel)
                                
                                return await interaction.showModal(modalFillInfo)

                            case 'manageEvents':
                                return sendCategoryEventManagementPanel(interaction, client, configSettings, extraPart)

                            default:
                                return interaction.reply({ content: "Unknown action.", flags: MessageFlags.Ephemeral })
                        }

                    case 'selectEvent':
                        const cat = configSettings.channels[extraPart]
                        if (!cat || !cat.events[selectedValue]) return interaction.reply({ content: "Event not found.", flags: MessageFlags.Ephemeral })

                        cat.events[selectedValue].enabled = !cat.events[selectedValue].enabled
                        updateGuildConfig(client, guildId, selectedSystem, configSettings)

                        return sendCategoryEventManagementPanel(interaction, client, configSettings, extraPart)

                    default:
                        return interaction.reply({ content: "Unknown action for logger system.", flags: MessageFlags.Ephemeral })
                }

            default:
                return interaction.reply({ content: "Unknown interaction.", flags: MessageFlags.Ephemeral })
        }
    }  
}
