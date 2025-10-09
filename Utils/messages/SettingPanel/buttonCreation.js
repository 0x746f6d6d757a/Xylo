import { StringSelectMenuBuilder } from "discord.js";
import { camelCaseToTitle } from "../stringParser.js";

/**
 * @param {Object} configSettings 
 * @param {import("discord.js").Interaction} interaction 
 * @returns {StringSelectMenuBuilder}
 */
export function getTopicEventCategoryMenu(guildSettings, interaction) {

    const stringSelectMenu = new StringSelectMenuBuilder()
        .setCustomId(`changeSettings|${interaction.guild.id}|select`)
        .setPlaceholder('Select a setting to change')

    guildSettings.forEach(config => {
        const { configType } = config
        stringSelectMenu.addOptions({ 
            label: camelCaseToTitle(configType), 
            description: `Change the settings for the ${camelCaseToTitle(configType)}.`,
            value: configType 
        })
    })

    return stringSelectMenu
}

