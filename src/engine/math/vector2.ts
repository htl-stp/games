export interface Vector2Like {
	x: number;
	y: number;
}

export class Vector2 implements Vector2Like {
	x: number;
	y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
}
