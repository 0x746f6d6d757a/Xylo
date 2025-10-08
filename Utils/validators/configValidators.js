/**
 * Validates the logger configuration object.
 * @param {Object} config 
 * @returns {boolean} True if valid, false otherwise.
 */
export function validateLoggerConfig(config) {
    if (typeof config !== 'object' || config === null) return false
    if (typeof config.enabled !== 'boolean') return false
    if (typeof config.loggingLevel !== 'number' || ![1, 2, 3].includes(config.loggingLevel)) return false
    if (config.adminRoleId && typeof config.adminRoleId !== 'string') return false
    if (config.categoryParentID && typeof config.categoryParentID !== 'string') return false
    if (config.channels) {
        if (typeof config.channels !== 'object' || config.channels === null) return false
        const validCategories = ['automod', 'guild', 'members', 'roles', 'invites', 'channels', 'messages', 'threads', 'voice']
        for (const [category, events] of Object.entries(config.channels)) {
            if (!validCategories.includes(category)) continue // Skip unknown categories
            if (typeof events !== 'object' || events === null) return false
            
            for (const [eventName, channelId] of Object.entries(events)) {
                if (channelId !== null && typeof channelId !== 'string') return false
            }
        }
    }
    
    return true
}