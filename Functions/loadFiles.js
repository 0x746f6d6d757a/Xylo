import { glob } from "glob"
import path from "path"
import { LogType } from "./logger"

export default async function loadFiles(directory) {

    try {
        const files = await glob(path.join(process.cwd(), directory, '**/*.js').replace(/\\/g, '/'))
        const jsFiles = files.filter(file => path.extname(file) === '.js')
        return jsFiles
    } catch (error) {
        logger(LogType.APP, LogType.ERROR, `Error loading files: ${error}`)
        return []
    }
}