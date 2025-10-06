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
    return true
}