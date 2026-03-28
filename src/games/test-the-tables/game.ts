import {Entity} from "../../engine/entity/entity.ts";
import {config} from "../../engine/config.ts";
import  {type Renderer} from "../../engine/core/renderer.ts";
import {Scene} from "../../engine/scenes/scene.ts";
import type {Input} from "../../engine/core/input.ts";
import {Game} from "../../engine/core/game.ts";
import {MenuScene} from "../../engine/scenes/menuScene.ts";

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
        r.advancedText(this.id.toString(),this.x +  this.w / 2, this.y + this.h / 2, config.theme.colors.white,
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
        super(x,y,40,20)
        this.tableId = id
    }
    render(r: Renderer) {

        r.drawRect(this.x,this.y,this.w,this.h, "rgba(255,255,255,0.2)")
        r.advancedText(this.tableId.toString(),this.x +  this.w / 2,this.y + this.y / 2,config.theme.colors.black,{textAlign:"center",textBaseline:"middle"})
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
    private state:GameState = "running";

    private slots:HomeSlot[] = []
    private tables:Table[] = []
    private targets:Target[] = [];

    private activeTableIndex: number = 0;
    private transitionTimer:number = 0;

    private levelTime:number = 15.0
    private currentTime:number = 15.0;

    constructor(private input:Input) {
        super();

        for (let i = 1; i <= 5; i++) {
            const slot = new HomeSlot(i,i-1)
            this.slots.push(slot)
            this.tables.push(new Table(i,slot))
        }
        input.onKeyDown(key => {
            if (this.state !== "running") return

            const val = parseInt(key)
            if (val >= 1 && val <= 5){
                this.activeTableIndex = val -1
            }
        })
        this.startNewRound();
    }
    private startNewRound() {
        this.targets = []
        this.activeTableIndex = -1
        this.state = "running"
        this.currentTime = this.levelTime
        this.tables.forEach(table => {
            table.reset()

            const rx = Math.random() * (config.canvas_width - table.w);
            const ry = 40 + Math.random() * (config.canvas_height - table.h - 40);

            this.targets.push(new Target(table.id,rx,ry,table.w,table.h));
        })
    }
    update(dt:number,input:Input) {
        if (this.state === "end") return

        this.currentTime -= dt;
        if (this.currentTime <= 0) {
            this.state = "end"
            return;
        }
        if(this.activeTableIndex !== -1){
        const t = this.tables[this.activeTableIndex];
        const target = this.targets[this.activeTableIndex];

        if(t.status !== "locked") {
            const speed = 400 * dt

            if (input.isDown("w")) t.y -= speed
            if (input.isDown("s")) t.y += speed
            if (input.isDown("a")) t.x -= speed
            if (input.isDown("d")) t.x += speed

            if (input.isDown("a") || (input.isDown("s")) || (input.isDown("a")) || (input.isDown("d"))) {
                t.status = "moving"
            }

            if (target.checkSnap(t)) {
                this.activeTableIndex = -1;

                if (this.tables.every(table => table.status === "locked")){
                    this.levelTime *= 0.9
                    this.startNewRound()
                }
            }
        }
        }

    }
    render(r: Renderer) {
        // 1. Hintergrund: Die leeren Home-Slots zuerst zeichnen
        this.slots.forEach(slot => slot.render(r));

        // 2. Ziele: Die Targets zeichnen, auf die die Tische bewegt werden müssen
        this.targets.forEach(target => target.render(r));

        // 3. Vordergrund: Die Tische zeichnen
        this.tables.forEach((table, index) => {
            // Optional: Den aktuell ausgewählten Tisch hervorheben
            if (index === this.activeTableIndex) {
                // Zeichne einen kleinen Rahmen um den aktiven Tisch
                r.drawRect(table.x - 2, table.y - 2, table.w + 4, table.h + 4, config.theme.colors.white);
            }
            table.render(r);
        });

        // 4. UI: Zeit-Anzeige
        const timeText = `TIME: ${Math.max(0, this.currentTime).toFixed(1)}s`;
        const timeColor = this.currentTime < 5 ? config.theme.colors.red : config.theme.colors.white;

        r.advancedText(timeText, 20, 80, timeColor, {
            textAlign: "left",
            textBaseline: "top"
        });

        if (this.state === "end") {
            r.drawRect(0, 0, config.canvas_width, config.canvas_height, "rgba(0, 0, 0, 0.85)");

            r.advancedText(
                "GAME OVER",
                config.canvas_width / 2,
                config.canvas_height / 2 - 20,
                config.theme.colors.red,
                { textAlign: "center", textBaseline: "middle" }
            );


        }
    }
}

export class TestTheTables extends Game {
    constructor() {
        super();
        this.scene = new MenuScene(() => {
            this.scene = new GameScene(this.input);
        });
    }
    reset(){
        this.scene = new GameScene(this.input);
    }
}