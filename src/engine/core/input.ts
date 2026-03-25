export class Input {
    keys = new Set<string>();

    private keyDownHandlers: ((key: string) => void)[] = [];
    private keyUpHandlers: ((key: string) => void)[] = [];

    constructor() {
        window.addEventListener("keydown", e => {
            this.keys.add(e.key)
            this.keyDownHandlers.forEach(fn => fn(e.key))
        });
        window.addEventListener("keyup", e => {
            this.keys.delete(e.key)
            this.keyUpHandlers.forEach(fn => fn(e.key))
        });
    }

    isDown(key: string) {
        return this.keys.has(key);
    }

    onKeyDown(handler: (key: string) => void) {
        this.keyDownHandlers.push(handler);
    }

    onKeyUp(handler: (key: string) => void) {
        this.keyUpHandlers.push(handler);
    }
}