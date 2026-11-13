import { Entity } from '@engine/entity/entity.ts';
import { config } from '@engine/config.ts';
import type { InflictsDamage } from '@games/cheat-and-flee/inflictsDamage.ts';
import type { Vulnerable } from '@games/cheat-and-flee/vulnerable.ts';
import type { Renderer } from '@engine/core/renderer.ts';

export class Rocket extends Entity implements InflictsDamage {
	color = config.theme.colors.red;
	lifetime = 3000; // in milliseconds
	speed = 250;

	targetX = 0;
	targetY = 0;

	// direction to go
	dirX = 0;
	dirY = 0;

	damage: number = 180;
	explosion_size_multiplier = 2;

	// NOTE: there's a lot of math here
	// don't ask me to elaborate, it took me modeling, heavy thinking and plenty of frustration
	constructor(
		targetX: number,
		targetY: number,
		private inflictsDamage: (Entity & InflictsDamage)[],
		offset_x: number,
		offset_y: number,
	) {
		super(config.canvas_width / 2 + offset_x, 155 + offset_y, 10, 10);
		this.speed = Math.floor(Math.random() * 250) + 150;
		this.targetX = targetX;
		this.targetY = targetY;

		// define "delta x" and "delta y", aka. the direction to go
		const dx = this.targetX - this.x;
		const dy = this.targetY - this.y;

		// define the hypotenuse
		// "I wish I was high on potenuse"
		const dist = Math.sqrt(dx * dx + dy * dy);

		// proportional division to get the vector direction
		// its just math, don't ask me
		this.dirX = dx / dist;
		this.dirY = dy / dist;
	}

	timer = 0;
	update(delta: number) {
		this.handleMovement(delta);

		if (this.timer >= this.lifetime) {
			for (let i = 0; i < this.inflictsDamage.length; i++) {
				if (this.inflictsDamage[i] === this) {
					this.inflictsDamage.splice(i, 1);
					return;
				}
			}
		}
		this.timer += delta * 1000;
	}

	handleMovement(delta: number) {
		this.x += this.dirX * this.speed * delta;
		this.y += this.dirY * this.speed * delta;
	}

	collidesWith(other: Entity & Vulnerable): boolean {
		return super.collidesWith(other);
	}

	render(r: Renderer) {
		r.drawRect(this.x - this.w / 2, this.y, this.w, this.h, this.color);
	}
}
