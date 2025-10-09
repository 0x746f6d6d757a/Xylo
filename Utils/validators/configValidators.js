import logger from "../../Functions/logger"

/**
 * Validates the logger configuration object.
 * @param {Object} config 
 * @returns {boolean} True if valid, false otherwise.
 */
export function validateLoggerConfig(config) {
    if (typeof config !== 'object' || config === null) {
        logger(LogType.APP, LogLevel.ERROR, 'Validation failed: config is not an object')
        return false
    }
    if (typeof config.enabled !== 'boolean') {
        logger(LogType.APP, LogLevel.ERROR, 'Validation failed: enabled is not a boolean')
        return false
    }
    if (typeof config.loggingLevel !== 'number' || ![1, 2, 3].includes(config.loggingLevel)) {
        logger(LogType.APP, LogLevel.ERROR, 'Validation failed: loggingLevel is invalid')
        return false
    }
    
    if (!config.channels || typeof config.channels !== 'object' || config.channels === null) {
        logger(LogType.APP, LogLevel.ERROR, 'Validation failed: channels is missing or not an object')
        return false
    }
    
    const validCategories = ['automod', 'guild', 'members', 'roles', 'invites', 'channels', 'messages', 'threads', 'voice']
    for (const [category, categoryData] of Object.entries(config.channels)) {
        if (!validCategories.includes(category)) {
            logger(LogType.APP, LogLevel.WARN, `Validation warning: unknown category ${category}, skipping`)
            continue
        }
        if (typeof categoryData !== 'object' || categoryData === null) {
            logger(LogType.APP, LogLevel.ERROR, `Validation failed: categoryData for ${category} is not an object`)
            return false
        }
        if (typeof categoryData.enabled !== 'boolean') {
            logger(LogType.APP, LogLevel.ERROR, `Validation failed: enabled for ${category} is not a boolean`)
            return false
        }
        
        if (categoryData.channelId !== null && categoryData.channelId !== undefined && typeof categoryData.channelId !== 'string') {
            logger(LogType.APP, LogLevel.ERROR, `Validation failed: channelId for ${category} is invalid (must be null or string)`)
            return false
        }
        
        if (!categoryData.events || typeof categoryData.events !== 'object' || categoryData.events === null) {
            logger(LogType.APP, LogLevel.ERROR, `Validation failed: events for ${category} is missing or not an object`)
            return false
        }
        
        for (const [eventName, eventData] of Object.entries(categoryData.events)) {
            if (typeof eventData !== 'object' || eventData === null) {
                logger(LogType.APP, LogLevel.ERROR, `Validation failed: eventData for ${category}.${eventName} is not an object`)
                return false
            }
            if (typeof eventData.enabled !== 'boolean') {
                logger(LogType.APP, LogLevel.ERROR, `Validation failed: enabled for ${category}.${eventName} is not a boolean`)
                return false
            }
        }
    }
    
    return true
}