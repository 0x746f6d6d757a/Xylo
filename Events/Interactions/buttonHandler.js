import { Events, Client, ButtonInteraction, MessageFlags } from "discord.js"
import { parseCustomId } from "../../Utils/messages/stringParser.js"
import { updateGuildConfig } from "../../Utils/database/databaseManager.js"
import sendLoggerPanel from "../../Utils/messages/Panels/loggerPanel.js"

export default {
    name: Events.InteractionCreate,
    /**`
     * @param {ButtonInteraction} interaction
     * @param {Client} client
    */
    async execute(interaction, client) {

        if(!interaction.isButton()) return

        const { customId, message } = interaction
        const { selectedSystem, guildId, selectedAction } = parseCustomId(customId)

        if(guildId !== interaction.guildId) return interaction.reply({ content: "This interaction does not belong to this guild.", flags: MessageFlags.Ephemeral })

        let guildSettings = client.guildConfigs.get(guildId) || []
        if(!guildSettings || guildSettings.length === 0) return interaction.reply({ content: "Guild settings could not be found. Please contact support.", flags: MessageFlags.Ephemeral })

        let configToEdit = guildSettings.find(config => config.configType === selectedSystem)
        if(!configToEdit) return interaction.reply({ content: "Selected configuration could not be found. Please contact support.", flags: MessageFlags.Ephemeral })

        let configSettings = typeof configToEdit.configSettings === 'string' ? JSON.parse(configToEdit.configSettings) : configToEdit.configSettings

        switch(selectedSystem) {
            case 'loggerSystem':
                switch(selectedAction) {
                    case 'toggle':
                        configSettings.enabled = !configSettings.enabled
                        updateGuildConfig(client, guildId, selectedSystem, configSettings)
                        return await sendLoggerPanel(configSettings, interaction, client)

                    case 'changeLevel':
                        // TODO: Show modal or select menu to change logging level
                        // configSettings.loggingLevel = newLevel
                        // updateGuildConfig(client, guildId, selectedSystem, configSettings)
                        // return await sendLoggerPanel(configSettings, interaction, client)
                        return interaction.reply({ content: "Change level feature coming soon!", flags: MessageFlags.Ephemeral })

                    case 'setAdminRole':
                        // TODO: Show role select menu
                        // configSettings.adminRoleId = newRoleId
                        // updateGuildConfig(client, guildId, selectedSystem, configSettings)
                        // return await sendLoggerPanel(configSettings, interaction, client)
                        return interaction.reply({ content: "Set admin role feature coming soon!", flags: MessageFlags.Ephemeral })

                    case 'setCategory':
                        // TODO: Show channel select menu for categories
                        // configSettings.categoryParentID = newCategoryId
                        // updateGuildConfig(client, guildId, selectedSystem, configSettings)
                        // return await sendLoggerPanel(configSettings, interaction, client)
                        return interaction.reply({ content: "Set category feature coming soon!", flags: MessageFlags.Ephemeral })

                    default:
                        return interaction.reply({ content: "Unknown action.", flags: MessageFlags.Ephemeral })
                }
            
            default:
                return interaction.reply({ content: "Unknown system.", flags: MessageFlags.Ephemeral })
        }
    }
}