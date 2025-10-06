import { Client, Events, MessageFlags, ModalSubmitInteraction } from "discord.js"
import { parseCustomId } from "../../Utils/messages/stringParser.js"
import { updateGuildConfig } from "../../Utils/database/databaseManager.js"
import sendLoggerPanel from "../../Utils/messages/Panels/loggerPanel.js"

export default {
    name: Events.InteractionCreate,
    /**
     * @param {ModalSubmitInteraction} interaction 
     * @param {Client} client
     */
    async execute(interaction, client) {
        if (!interaction.isModalSubmit()) return

        const { customId } = interaction
        const { guildId, selectedSystem, selectedAction } = parseCustomId(customId)

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

                        if (isNaN(newLevel) || newLevel < 1 || newLevel > 3) {
                            return interaction.reply({ content: "Invalid logging level. Please enter a level between 1 and 3.", flags: MessageFlags.Ephemeral })
                        }

                        configSettings.loggingLevel = newLevel
                        updateGuildConfig(client, guildId, selectedSystem, configSettings)
                        return await sendLoggerPanel(configSettings, interaction, client)

                }
        }

    }
}
