import {Scene} from "./scene.ts";
import type {Renderer} from "../core/renderer.ts";
import type {Input} from "../core/input.ts";
import {config} from "../config.ts";

export class MenuScene extends Scene {
    constructor(private onStart: () => void, private img?: HTMLImageElement) {
        super();
    }

    update(delta: number, input: Input): void {
        if (input.isDown("Enter")) {
            this.onStart()
        }
    }
    render(r: Renderer) {
        if (this.img) r.drawImage(this.img, 0, 0, config.canvas_width, config.canvas_height);

        r.advancedText("PRESS    START", config.canvas_width / 2, config.canvas_height / 2, "#fff", {
            textBaseline: "middle",
            textAlign: "center",
        })
    }
}