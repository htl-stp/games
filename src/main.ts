import {Game} from "./engine/core/game.ts";
import {createGamePage} from "./engine/bootstrap.ts";
import {Scene} from "./engine/scenes/scene.ts";
import type {Renderer} from "./engine/core/renderer.ts";

class TestGame extends Game {
    constructor() {
        super();

        this.scene = new class extends Scene {
            render(renderer: Renderer): void {
                renderer.drawRect(0, 0, 100 ,100, "#ff0000")
            }
        }
    }
}

createGamePage(TestGame)