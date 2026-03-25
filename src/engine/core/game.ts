import  {type Renderer} from "./renderer.ts";
import  {type Scene} from "../scenes/scene.ts";
import  {type Input} from "./input.ts";

export abstract class Game {
    private lastTime = 0;
    private renderer?: Renderer;
    private _input?: Input;
    private _scene?: Scene;

    private timeBuffer = 0;

    constructor() {
        this.loop = this.loop.bind(this);
    }


    get input(): Input {
        if (!this._input) throw new Error("Input not found");
        return this._input;
    }
    get scene(): Scene {
        if (!this._scene) throw new Error("Scene not found");
        return this._scene;
    }

    set scene(value: Scene) {
        this._scene = value;
    }


    init(renderer: Renderer, input: Input) {
        this.renderer = renderer;
        this._input = input;
    }

    async start() {
        this.lastTime = Date.now();
        requestAnimationFrame(this.loop);
    }

    reset() {}

    loop() {
        if (!this.renderer) throw new Error("Renderer not found");
        if (!this._scene) throw new Error("scene not found");
        if (!this._input) throw new Error("Input not found");

        const now = Date.now();
        const delta = (now - this.lastTime) / 1000;
        this.lastTime = now;

        if (delta > 500) console.error("delta time too high")

        this.update(delta, this._scene, this._input)
        this.render(this.renderer, this._scene);

        requestAnimationFrame(this.loop);
    };

    update(delta: number, scene: Scene, input: Input) {
        scene.update(delta, input);
    }

    private render(renderer: Renderer, scene: Scene) {
        renderer.clear();

        scene.render(renderer);

        renderer.drawScreenlines();
    }
}