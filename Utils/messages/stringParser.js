/**
 * Parses a custom ID string into its components.
 * @param {String} customId 
 * @returns {Object} { guildId, selectedSystem, selectedAction }
 */
export function parseCustomId(customId) {

    const parts = customId.split('|')

    return {
        selectedSystem: parts[0],
        guildId: parts[1],
        selectedAction: parts[2]
    }
}
/**
 * Converts a camelCase string to a title case string.
 * @param {String} str 
 * @returns {String}
 */
export function camelCaseToTitle(str) {
    return str.replace(/([A-Z])/g, ' $1').trim().replace(/\b\w/g, char => char.toUpperCase())
}