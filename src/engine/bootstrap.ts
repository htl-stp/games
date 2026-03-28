import type {Game} from "./core/game.ts";
import {Renderer} from "./core/renderer.ts";
import {Input} from "./core/input.ts";
import {config} from "./config.ts";
import {AssetLoader} from "./assets/assetloader.ts";

export async function createGamePage(GameClass: new () => Game) {
    console.log("test")

    const canvas = document.getElementById("gamecanvas") as HTMLCanvasElement;

    canvas.width = config.canvas_width
    canvas.height = config.canvas_height

    const renderer = new Renderer(canvas);
    const input = new Input();

    const game = new GameClass();

    const assetLoader = new AssetLoader();

    game.loadAssets(assetLoader);

    await assetLoader.loadAll()

    game.init(renderer, input)

    game.start()

    window.addEventListener("keydown", (e) => {
        if (e.key.toLowerCase() === "r") {
            game.reset();
        }
    })
}