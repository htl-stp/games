export class Sound {
    private audio: HTMLAudioElement;

    constructor(public readonly src: string) {
        this.audio = new Audio(src);
        this.audio.volume = 0.5;
    }

    play() {
        this.audio.play();
    }
}