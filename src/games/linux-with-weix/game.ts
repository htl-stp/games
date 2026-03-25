import {Game} from "../../engine/core/game.ts";
import {Entity} from "../../engine/entity/entity.ts";
import type {Renderer} from "../../engine/core/renderer.ts";
import {Screen} from "../../engine/screens/screen.ts";
import {config} from "../../engine/config.ts";
import type {Input} from "../../engine/core/input.ts";

class Weix extends Entity {
    constructor() {
        const size = 50
        super(config.canvas_width / 2 - size / 2, config.canvas_height / 2 - size / 2 - 10, size, size);
    }

    render(r: Renderer) {
        r.drawRect(this.x, this.y, this.w, this.h, "#00aaff")
    }
}

class Student extends Entity {
    speed = 0;
    direction = 1;
    nextPhase = 0;
    timer = 0;

    private scared = false;

    constructor(startX: number) {
        const height = 20
        const width = 15

        super(startX, config.canvas_height - 40 - height, 15, 20);
    }

    randomize() {
        this.speed = 15 + Math.random() * 50
        this.direction = Math.round(Math.random() * 2 - 1)
        this.nextPhase = 0.2 + Math.random() * 1.2
    }

    randomizePosition() {
        this.x = 20 + Math.random() * (config.canvas_width - 20 * 2);
    }

    scare() {
        this.scared = true;
    }

    update(dt: number) {
        if (this.scared) return;

        if (this.timer > this.nextPhase) {
            this.timer = 0;
            this.randomize();
        }

        this.timer += dt;

        const padding = 20;

        if (
            (this.direction > 0 && this.x > config.canvas_width - padding) ||
            (this.direction < 0 && this.x < padding)
        ) {
            this.randomize()
            return;
        }

        this.x += this.speed * dt * this.direction;
    }

    render(r: Renderer) {
        const color = this.scared ? "#663399" : "#ff0000"

        r.drawRect(this.x, this.y, this.w, this.h, color)
    }
}

class ScareArea extends Entity {
    constructor() {
        const width = 80;

        super(config.canvas_width / 2 - width / 2, 0, width, config.canvas_height);
    }

    render(r: Renderer) {
        r.drawRect(this.x, this.y, this.w, this.h, "#113")
    }
}

type GameState = "start" | "running" | "end";

class GameScreen extends Screen {
    entities: Entity[] = [];

    score: number = 0;
    gamestate: GameState = "running";

    constructor() {
        super();

        this.entities.push(new ScareArea());
        this.entities.push(new Weix())

        const gap = (config.canvas_width - 40) / 10
        for (let i = 0; i < 10; i++) {
            const s = new Student(20 + gap * i)
            this.entities.push(s)
        }
    }

    render(r: Renderer) {
        const currentTime = Math.floor(Date.now() * 3 / 1000);

        for (const e of this.entities) {
            e.render(r)
        }

        r.text(`Score: ${this.score}`, 10, 20, "#fff")

        if (this.score === 1000) {
            if (currentTime % 2) {
                r.text(`JACKPOT`, config.canvas_width - 65, 20, "#fff")
            }
        }
    }

    update(dt: number, input: Input) {
        if (this.gamestate === "running") {
            for (const e of this.entities) {
                e.update(dt)
            }
        }

        this.handleInput(input)
    }

    handleInput(input: Input) {
        if (input.isDown(" ")) {
            if (this.gamestate === "running") {
                this.scareStudents()
            }
        }
    }

    scareStudents() {
        const scareArea = this.entities.find(e => e instanceof ScareArea)!;

        for (const e of this.entities) {
            if (e instanceof Student) {
                if (e.collidesWith(scareArea)) {
                    this.score += 100;
                    e.scare();
                }
            }
        }

        this.gamestate = "end";
    }
}

export class LinuxWithWeix extends Game {
    constructor() {
        super();

        this.screen = new GameScreen()
    }

    reset() {
        this.screen = new GameScreen()
    }
}