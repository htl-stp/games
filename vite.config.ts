import {defineConfig} from "vite";
import * as fs from "node:fs";
import {resolve} from "node:path";


const gamesDir = resolve(__dirname, 'src/games')
const gameFolders = fs.readdirSync(gamesDir)
const input: Record<string,string> = {
    main: resolve(__dirname, 'index.html')
}

for (const folder of gameFolders) {
    input[folder] = resolve(gamesDir, folder, 'index.html')
}


export default defineConfig({
    base: "./",
    build: {
        rolldownOptions: {
            input
        }
    }
})