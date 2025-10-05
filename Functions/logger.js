import chalk from "chalk";

// Color definitions for different log levels
const colorHash = {
    lightBlue: chalk.hex('#51d4fcff'),
    lightYellow: chalk.hex('#fcf351ff'),
    lightPurple: chalk.hex('#c751fcff'),
    lightGray: chalk.hex('#d3d3d3ff'),
    darkRed: chalk.hex('#9e1c1cff'),
    darkPurple: chalk.hex('#6f1c9eff')
}

/**
 * Logger function to log messages with different levels and types
 * @param {string} type - The type of the log (e.g., 'app', 'db')
 * @param {string} level - The level of the log (e.g., 'info', 'warn', 'error')
 * @param {string} message - The message to log
 */
export default function logger(type, level, message) {
    const timestamp = formatDate()

    switch (type) {

        case 'db':
            switch (level) {
                case 'info':
                    console.log(colorHash.lightPurple(`[${timestamp}] [DB INFO] ${message}`))
                    break
                case 'error':
                    console.log(colorHash.darkPurple(`[${timestamp}] [DB ERROR] ${message}`))
                    break
            }
            break

        case 'app':
            switch (level) {
                case 'info':
                    console.log(colorHash.lightBlue(`[${timestamp}] [INFO] ${message}`))
                    break
                case 'warn':
                    console.log(colorHash.lightYellow(`[${timestamp}] [WARN] ${message}`))
                    break
                case 'error':
                    console.log(colorHash.darkRed(`[${timestamp}] [ERROR] ${message}`))
                    break
                default:
                    console.log(colorHash.lightGray(`[${timestamp}] [DEBUG] ${message}`))
                    break
            }
            break

    }

}

/**
 * Formats the date to a readable string
 * @param {Date} date 
 * @returns {string} Formatted date string
 */
function formatDate(date = new Date()) {

    const pad = (n) => n.toString().padStart(2, '0')

    const year = date.getFullYear()
    const month = pad(date.getMonth() + 1)
    const day = pad(date.getDate())
    const hours = pad(date.getHours())
    const minutes = pad(date.getMinutes())

    return `${day}/${month}/${year} ${hours}:${minutes}`
}