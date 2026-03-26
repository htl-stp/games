import {Entity} from "./entity.ts";
import {config} from "../config.ts";
import type {Renderer} from "../core/renderer.ts";
import type {Signal} from "../utils/signal.ts";

export class HeartDisplay extends Entity {
    static readonly maxLifes: number = 3;
    static readonly padding: number = 7

    constructor(public lifes: Signal<number>) {
        super(config.canvas_width - HeartDisplay.padding, HeartDisplay.padding, 0, 0);
    }

    render(r: Renderer) {
        r.advancedText(`Lives: ${this.lifes()}`, this.x, this.y, "#fff", {
            textBaseline: "top",
            textAlign: "right",
        })
    }
}