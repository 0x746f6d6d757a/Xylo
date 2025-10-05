import { glob } from "glob"
import path from "path"

export default async function loadFiles(directory) {

    try {
        const files = await glob(path.join(process.cwd(), directory, '**/*.js').replace(/\\/g, '/'))
        const jsFiles = files.filter(file => path.extname(file) === '.js')
        return jsFiles
    } catch (error) {
        logger('app', 'error', `Error loading files: ${error}`)
        return []
    }
}