import {Entity} from "../../engine/entity/entity.ts";
import type {Renderer} from "../../engine/core/renderer.ts";
import type {Input} from "../../engine/core/input.ts";
import {config} from "../../engine/config.ts";
import {Game} from "../../engine/core/game.ts";
import {Scene} from "../../engine/scenes/scene.ts";

class Mauss extends Entity {
    private active = false;
    private timer = 0;


    constructor(x: number, y: number) {
        const size = 20
        super(x, y, size, size)
    }

    spawn() {
        if (Math.random() < 0.3) {
            this.active = true;
            this.timer = 2;
            console.log("Mauss Spawned")
        }
    }

    update(dt: number) {
        if (this.active) {
            this.timer -= dt
            if (this.timer <= 0) {
                this.active = false;
                console.log("Mauss despawned")
            }
        }
    }

    render(r: Renderer) {
        if (!this.active) {
            r.drawRect(this.x, this.y, this.w, this.h, "#010101")
        } else {
            r.drawRect(this.x, this.y, this.w, this.h, "#a00f05")
        }
    }

    getHit() {
        this.active = false;
    }

    peek() {
        this.active = true;
    }

    isActive() {
        return this.active;
    }
}

class Hammer extends Entity {
    speed = 60
    private ready = true;

    constructor() {
        const size = 12
        super(0, 0, size, size)
    }

    render(r: Renderer) {
        r.drawRect(this.x, this.y, this.w, this.h, "#101af1")
    }
}

class HitBox extends Entity {
    constructor(x: number, y: number, w: number, h: number) {
        super(x, y, w, h);
    }
}

type GameState = "start" | "running" | "end"

class GameScene extends Scene {
    entities: Entity[] = [];
    score: number = 0
    gamestate: GameState = "running"

    timer: number = 0;

    constructor() {
        super()
        this.entities.push(new Hammer());

        const y = 100

        for (let i = 0; i < 4; i++) {
            const x = 40 + i * 50
            const m = new Mauss(x, y);
            this.entities.push(m);
        }
    }

    render(r: Renderer) {
        for (const e of this.entities) {
            e.render(r)
        }
        r.text(`Score: ${this.score}`, 10, 20, "#fff")
    }

    update(dt: number, input: Input) {
        this.timer += dt;

        if (this.gamestate === "running") {
            for (const e of this.entities) {
                e.update(dt)

                if (this.timer > 1 && e instanceof Mauss) {
                    e.spawn()
                }
            }

            if (this.timer > 1) {
                this.timer -= 1;
            }
        }
        this.handleInput(input, dt)

    }

    handleInput(input: Input, dt: number) {
        if (input.isDown(" ")) {
            if (this.gamestate === "running") {
                this.hitMauss()
            }
        }
        if (input.isDown("a")) {
            if (this.gamestate === "running") {
                this.moveLeft(dt)
            }
        }
        if (input.isDown("d")) {
            if (this.gamestate === "running") {
                this.moveRight(dt)
            }
        }
    }

    hitMauss() {
        const hammer = this.entities.find(e => e instanceof Hammer)!
        const hitBox = new HitBox(hammer.x, hammer.y, hammer.w, config.canvas_height);

        const mausses: Mauss[] = []

        for (const e of this.entities) {
            if (e instanceof Mauss) {
                mausses.push(e)
            }
        }

        for (const m of mausses) {
            if (m.isActive() && hitBox.collidesWith(m)) {
                m.getHit()
                this.score += 100
            }
        }
    }

    moveLeft(dt: number) {
        const hammer = this.entities.find(e => e instanceof Hammer)!
        if (hammer.x < 20) {
            return
        }
        hammer.x -= hammer.speed * dt
    }

    moveRight(dt: number) {
        const hammer = this.entities.find(e => e instanceof Hammer)!
        if (hammer.x > config.canvas_width) {
            return
        }
        hammer.x += hammer.speed * dt
    }
}

export class HitTheMauss extends Game {
    constructor() {
        super();

        this.scene = new GameScene();
    }

    reset() {
        this.scene = new GameScene();
    }

}
