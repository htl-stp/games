export class Renderer {
    ctx: CanvasRenderingContext2D;
    cache = new Map<string, HTMLImageElement>();

    constructor(private canvas: HTMLCanvasElement) {
        this.ctx = canvas.getContext("2d")!;

        this.ctx.imageSmoothingEnabled = false
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    drawRect(x: number, y: number, w: number, h: number, c: string) {
        this.ctx.fillStyle = c;
        this.ctx.fillRect(
            Math.floor(x),
            Math.floor(y),
            Math.floor(w),
            Math.floor(h)
        );
    }

    async loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            if (this.cache.has(src)) {
                resolve(this.cache.get(src)!);
            }

            const img = new Image()
            img.src = src
            img.onload = () => {
                this.cache.set(src, img);
                resolve(img)
            }
            img.onerror = reject
        })
    }

    drawImage(img: HTMLImageElement, x: number, y: number, w?: number, h?: number) {
        this.ctx.drawImage(
            img,
            Math.floor(x),
            Math.floor(y),
            w ?? img.width,
            h ?? img.height,
        )
    }

    get width() {
        return this.canvas.width;
    }

    get height() {
        return this.canvas.height;
    }
}