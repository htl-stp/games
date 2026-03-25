import  {type Renderer} from "./renderer.ts";
import  {type Screen} from "../screens/screen.ts";
import  {type Input} from "./input.ts";

export abstract class Game {
    private lastTime = 0;
    private renderer?: Renderer;
    private _input?: Input;
    private _screen?: Screen;

    private timeBuffer = 0;

    constructor() {
        this.loop = this.loop.bind(this);
    }


    get input(): Input {
        if (!this._input) throw new Error("Input not found");
        return this._input;
    }
    get screen(): Screen {
        if (!this._screen) throw new Error("Screen not found");
        return this._screen;
    }

    set screen(value: Screen) {
        this._screen = value;
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
        if (!this._screen) throw new Error("Screen not found");
        if (!this._input) throw new Error("Input not found");

        const now = Date.now();
        const delta = (now - this.lastTime) / 1000;
        this.lastTime = now;

        if (delta > 500) console.error("delta time too high")

        this.update(delta, this._screen, this._input)
        this.render(this.renderer, this._screen);

        requestAnimationFrame(this.loop);
    };

    update(delta: number, screen: Screen, input: Input) {
        screen.update(delta, input);
    }

    private render(renderer: Renderer, screen: Screen) {
        renderer.clear();

        screen.render(renderer);

        renderer.drawScreenlines();
    }
}