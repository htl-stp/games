export function signal<T>(initial: T): Signal<T> {
	const subscribers: SignalSubscription<T>[] = [];
	let value = initial;

	function read() {
		return value;
	}

	read.set = (newValue: T) => {
		for (const s of subscribers) {
			s(value, newValue);
		}

		value = newValue;
	};

	read.update = (c: (v: T) => T) => {
		const newValue = c(value);

		for (const s of subscribers) {
			s(value, newValue);
		}

		value = newValue;
	};

	read.subscribe = (c: (v: T) => void) => {
		subscribers.push(c);
	};

	return read;
}

export type SignalSubscription<T> = (newValue: T, oldValue: T) => void;

export type Signal<T> = {
	(): T;
	set(value: T): void;
	update(fn: (value: T) => T): void;
};
