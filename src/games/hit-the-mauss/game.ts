import {Entity} from "../../engine/entity/entity.ts";
import type {Renderer} from "../../engine/core/renderer.ts";
import type {Input} from "../../engine/core/input.ts";
import {config} from "../../engine/config.ts";

class Mauss extends Entity{
    private active = false;
    constructor() {
        const size = 20
        super(0,0,size,size)
    }
    render(r:Renderer){
        r.drawRect(this.x,this.y,this.w,this.h,"#a00f05")
    }
    getHit(){
        this.active = false;
    }
    peek(){
        this.active = true;
    }
}
class Hammer extends Entity{
    speed = 20
    private ready = true;
    constructor() {
        const size = 30
        super(0,0,size,size)
    }
    render(r:Renderer){
        r.drawRect(this.x,this.y,this.w,this.h,"#101af1")
    }
}

class HitBox extends Entity{
    constructor(x:number, y:number,w:number,h:number) {
        super(x,y,w,h);
    }
}
type GameState = "start" | "running" | "end"
class GameScreen extends Screen{
    entities: Entity[] = [];
    score:number = 0
    gamestate: GameState = "running"

    constructor() {
        super()
        this.entities.push(new Hammer());
        for (let i = 0; i < 10; i++) {
            const m = new Mauss();
            this.entities.push(m);
        }
    }
    render(r:Renderer){
        for (const e of this.entities) {
            e.render(r)
        }
        r.text(`Score: ${this.score}`,10,20, "#fff")
    }

    update(dt:number, input:Input){
        if(this.gamestate === "running"){
            for (const e of this.entities) {
                e.update(dt)
            }
        }
        this.handleInput(input, dt)

    }
    handleInput(input:Input, dt:number){
        if(input.isDown(" ")){
            if(this.gamestate === "running"){
                this.hitMauss()
            }
        }
        if(input.isDown("a")){
            if(this.gamestate === "running"){
                this.moveLeft(dt)
            }
        }
        if(input.isDown("d")){
            if(this.gamestate === "running"){
                this.moveRight(dt)
            }
        }
    }

    hitMauss(){
        const hammer = this.entities.find(e => e instanceof Hammer)!
        const hitBox = new HitBox(hammer.x,hammer.y,hammer.w,hammer.h);

        const mausses:Mauss[] = []

        for (const e of this.entities) {
            if(e instanceof Mauss){
                mausses.push(e)
            }
        }

        for (const m of mausses) {
            if(hitBox.collidesWith(m)){
                m.getHit()
                this.score += 100
            }
        }
    }
    moveLeft(dt:number){
        const hammer = this.entities.find(e => e instanceof Hammer)!
        if(hammer.x < 20){
            return
        }
        hammer.x -= hammer.speed * dt
    }

    moveRight(dt:number){
        const hammer = this.entities.find(e => e instanceof Hammer)!
        if(hammer.x > config.canvas_width){
            return
        }
        hammer.x += hammer.speed * dt
    }



}
