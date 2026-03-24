import {Screen} from "./screen.ts";
import type {Renderer} from "../core/renderer.ts";

export class ExampleScreen extends Screen {
    currentColor = "#ff00ff"
    currentTime = 0;

    update(delta: number) {
        this.currentTime += delta;
        console.log(this.currentTime);

        if (this.currentTime >= 3) {
            this.currentColor = "#f0f0f0"
        }
    }

    render(renderer:Renderer) {
        console.log("rendering example")
        renderer.ctx.fillStyle = this.currentColor;
        renderer.ctx.fillRect(0, 0, renderer.width, renderer.height);
    }
}