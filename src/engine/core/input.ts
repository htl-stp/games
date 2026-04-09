export class Input {
	keys = new Set<string>();

	private keyDownHandlers: ((key: string) => void)[] = [];
	private keyUpHandlers: ((key: string) => void)[] = [];

	constructor() {
		window.addEventListener('keydown', (e) => {
			this.keys.add(e.key);
			this.keyDownHandlers.forEach((fn) => fn(e.key));
		});
		window.addEventListener('keyup', (e) => {
			this.keys.delete(e.key);
			this.keyUpHandlers.forEach((fn) => fn(e.key));
		});
	}

	/**
	 * Returns true if the given key (or any key in the list) is currently pressed.
	 *
	 * Behavior:
	 * - If an array is provided, returns true if ANY key is pressed.
	 * - Case-Sensitive
	 *
	 * @param key A single key or array of keys to check.
	 * @returns True if they key (or any in the list) is pressed.
	 *
	 * @example
	 * isDown("w")              // true if 'w' is pressed
	 * isDown(["w", "a"])       // true if 'w' or 'a' is pressed
	 */
	isDown(key: string | string[]): boolean {
		return Array.isArray(key) ? key.some((k) => this.keys.has(k)) : this.keys.has(key);
	}

	onKeyDown(handler: (key: string) => void) {
		this.keyDownHandlers.push(handler);
	}

	onKeyUp(handler: (key: string) => void) {
		this.keyUpHandlers.push(handler);
	}
}
