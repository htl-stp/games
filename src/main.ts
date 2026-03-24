import {Game} from "./game/core/game.ts";
import {Renderer} from "./game/core/renderer.ts";
import {ExampleScreen} from "./game/screens/exampleScreen.ts";

console.log("test")

const canvas = document.getElementById("gamecanvas") as HTMLCanvasElement;

const renderer = new Renderer(canvas);

console.log("game created")
const game = new Game(renderer, new ExampleScreen());
game.start()