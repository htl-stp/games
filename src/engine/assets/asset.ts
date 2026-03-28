export interface Asset {
    load(): Promise<void>;
}

export class ImageAsset implements Asset {
    img!: HTMLImageElement;

    constructor(public src: string) {}

    async load() {
        this.img = new Image();
        this.img.src = this.src;

        await new Promise<void>((res, rej) => {
            this.img.onload = () => res();
            this.img.onerror = () => rej();
        });
    }
}

export class SoundAsset implements Asset {
    private audio!: HTMLAudioElement;

    constructor(public src: string) {}

    async load(): Promise<void> {
        this.audio = new Audio(this.src);

        await new Promise<void>((res, rej) => {
            this.audio.oncanplaythrough = () => res();
            this.audio.onerror = () => rej();
        })

        this.audio.volume = 0.5;
    }

    play(): void {
        this.audio.currentTime = 0;
        this.audio.play();
    }
}