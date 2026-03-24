import {createGamePage} from "../../engine/bootstrap.ts";
import {Game} from "../../engine/core/game.ts";
import type {Renderer} from "../../engine/core/renderer.ts";
import {Screen} from "../../engine/screens/screen.ts";

class ExampleGame1 extends Game {
    constructor() {
        super();

        this.screen = new class extends Screen {
            update() {}
            render(renderer: Renderer) {
                renderer.drawRect(0, 0, renderer.width, renderer.height, "#ff0000")
            }
        }
    }
}

createGamePage(ExampleGame1)