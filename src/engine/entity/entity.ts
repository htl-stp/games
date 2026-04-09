import type { Vector2Like } from '../math/vector2.ts';
import type { Renderer } from '../core/renderer.ts';

export abstract class Entity implements Vector2Like {
	x: number;
	y: number;
	w: number;
	h: number;

	protected constructor(x: number, y: number, w: number, h: number) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}

	collidesWith(other: Entity) {
		return (
			this.x < other.x + other.w &&
			this.x + this.w > other.x &&
			this.y < other.y + other.h &&
			this.y + this.h > other.y
		);
	}

	update(delta: number) {}
	render(renderer: Renderer) {}
}
