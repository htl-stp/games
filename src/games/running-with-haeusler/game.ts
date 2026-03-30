import {Entity} from "../../engine/entity/entity.ts";
import {config} from "../../engine/config.ts";
import type {Renderer} from "../../engine/core/renderer.ts";

class Haeusler extends Entity{
    private nextPosY:number;
    public speed: number = 200;
    public difficulty: number = 1.0

    constructor() {
        super(config.canvas_width - 100, config.canvas_height - 100, 40,80);
        this.nextPosY = this.y
    }

    update(dt: number) {
        const currentSpeed = this.speed * this.difficulty;

        if (this.y < this.nextPosY) this.y += currentSpeed * dt;
        if (this.y > this.nextPosY) this.y -= currentSpeed * dt;

        if (Math.abs(this.y - this.nextPosY) < 5) {
            this.nextPosY = Math.random() * (config.canvas_height * this.h);
        }
    }
    render(r: Renderer) {
        r.drawRect(this.x,this.y,this.w,this.h,config.theme.colors.red);

        r.drawRect(this.x - 200,this.y,200,this.h,"rgba(0,255,0,0.1)");
    }
}

class Student extends Entity{
    private verticalSpeed:number = 400;
    private horizontalPushSpeed = 200;


    constructor(x:number, y:number) {
        super(x,y,30,30);
    }
    updatePosition(dt:number, inSlipstream:boolean,targetX:number,difficulty:number) {
        if (inSlipstream){
            const targetPos = targetX -50;
            if (this.x < targetPos) {
                this.x += this.horizontalPushSpeed;
            }
        }else{
            const driftPower = 150 * difficulty;
            this.x -= driftPower * dt;
        }
    }
    moveUp(dt:number) {
        if (this.y > 0){
            this.y -= this.verticalSpeed * dt;
        }
    }
    moveDown(dt:number) {
        if (this.y + this.h < config.canvas_height){
            this.y += this.verticalSpeed * dt;
        }
    }





}