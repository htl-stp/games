export class Renderer {
    ctx: CanvasRenderingContext2D;

    constructor(private canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext("2d")!;

        this.ctx.imageSmoothingEnabled = false
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawRect(x: number, y: number, w: number, h: number, c: string) {
        this.ctx.fillStyle = c;
        this.ctx.fillRect(x, y, w, h);
    }

    get width() {
        return this.canvas.width;
    }

    get height() {
        return this.canvas.height;
    }
}