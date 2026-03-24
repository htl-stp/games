import type {Renderer} from "./renderer.ts";
import type {Screen} from "../screens/screen.ts";

export class Game {
    private lastTime = Date.now();

    constructor(private renderer: Renderer, private screen: Screen) {
        this.loop = this.loop.bind(this);
    }

    start() {
        requestAnimationFrame(this.loop);
    }

    loop() {
        console.log("gameloop")

        const now = Date.now();
        const delta = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.update(delta)
        this.draw(this.renderer);

        requestAnimationFrame(this.loop);
    };

    update(delta: number) {
        this.screen.update(delta);
    }

    draw(renderer: Renderer) {
        this.renderer.clear();

        this.screen.render(renderer);
    }
}