import {Game} from "./game/core/game.ts";
import {Renderer} from "./game/core/renderer.ts";

const canvas = document.getElementById("gamecanvas") as HTMLCanvasElement;

const renderer = new Renderer(canvas);

const game = new Game(renderer);
game.start()