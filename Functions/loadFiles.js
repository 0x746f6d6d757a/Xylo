import { glob } from "glob"
import path from "path"
import logger, { LogType, LogLevel } from "./logger.js"

export default async function loadFiles(directory) {

    try {
        const files = await glob(path.join(process.cwd(), directory, '**/*.js').replace(/\\/g, '/'))
        const jsFiles = files.filter(file => path.extname(file) === '.js')
        return jsFiles
    } catch (error) {
        logger(LogType.APP, LogLevel.ERROR, `Error loading files: ${error}`)
        return []
    }
}