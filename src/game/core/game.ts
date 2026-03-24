import type {Renderer} from "./renderer.ts";

export class Game {
    private lastTime = 0;

    constructor(private renderer: Renderer) {
        this.loop = this.loop.bind(this);
    }

    start() {
        requestAnimationFrame(this.loop);
    }

    loop() {
        console.log("gameloop")

        const now = Date.now();
        const delta = now - this.lastTime;
        this.lastTime = now;

        this.update(delta)
        this.draw(this.renderer);

        requestAnimationFrame(this.loop);
    };

    update(delta: number) {
        console.log(delta)
    }

    draw(renderer: Renderer) {}
}