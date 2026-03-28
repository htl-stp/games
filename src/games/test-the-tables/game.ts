import {Entity} from "../../engine/entity/entity.ts";
import {config} from "../../engine/config.ts";
import  {type Renderer} from "../../engine/core/renderer.ts";
import {Scene} from "../../engine/scenes/scene.ts";

type TableStatus = "home" | "moving" | "locked";

class Table extends Entity {
    public status: TableStatus = "home";
    public target: {x:number, y:number, w:number, h:number} | null = null;

    constructor(public id: number, private home: HomeSlot) {
        super(home.x,home.y,home.w,home.h);
    }

    render(r: Renderer) {
        const color = this.status === "locked" ? config.theme.colors.green : config.theme.colors.blue;

        r.drawRect(this.x,this.y,this.w,this.h,color)
        r.advancedText(this.id.toString(),this.x, this.y, config.theme.colors.white,
            {textAlign : "center", textBaseline : "middle"})
    }

    reset() {
        this.x = this.home.x;
        this.y = this.home.y;
        this.status = "home";
    }
}

class HomeSlot extends Entity {
    public tableId: number;

    constructor(id:number, index:number) {
        const spacing = config.canvas_width / 5
        const x = (index*spacing) + (spacing / 2) - 30
        const y = 20
        super(x,y,60,40)
        this.tableId = id
    }
    render(r: Renderer) {

        r.drawRect(this.x,this.y,this.w,this.h, "rgba(255,255,255,0.2)")
        r.advancedText(this.tableId.toString(),this.x,this.y,config.theme.colors.black,{textAlign:"center",textBaseline:"middle"})
    }
}

class Target extends Entity {
    public isFilled: boolean = false;

    constructor(public id:number, x:number, y:number, w:number, h:number) {
        super(x, y, w, h);
    }
    checkSnap(table:Table):boolean {
        if(table.id !== this.id || this.isFilled){return false}

        if(table.collidesWith(this)){
            table.x = this.x;
            table.y = this.y;
            this.isFilled = true;
            table.status = "locked";
            return true;
        }
        return false;
    }
    render(r: Renderer) {
        const color = this.isFilled? config.theme.colors.green : "rgba(255,255,255,0.2)";
        r.drawRect(this.x,this.y,this.w,this.h,color)

        r.advancedText(this.id.toString(),this.x, this.y, config.theme.colors.white,
            {textAlign : "center", textBaseline : "middle"})
    }
}
type GameState = "start" | "running" | "end"

class GameScene extends Scene {

}