import { Entity } from '@engine/entity/entity.ts';
import type { InflictsDamage } from '@games/cheat-and-flee/inflictsDamage.ts';
import { config } from '@engine/config.ts';
import type { Vulnerable } from '@games/cheat-and-flee/vulnerable.ts';
import type { Renderer } from '@engine/core/renderer.ts';

export class Bullet extends Entity implements InflictsDamage {
	color = config.theme.colors.yellow;
	speed = 40;

	// the more speed, the shorter the lifetime
	// 2000 seconds,

	/*
	lifetime
		^
		|\
		| \
		|  \
		|   \
		|    \
		|-------------------------->
															speed
	 */
	lifetime =  2000 * (this.speed*0.99)/this.speed; // in milliseconds

	targetX = 0;
	targetY = 0;

	// direction to go
	dirX = 0;
	dirY = 0;

	damage: number = 10;
	explosion_size_multiplier: number = 5;

	accuracy: number = 10; // accuracy, 0 = pinpoint

	// NOTE: there's a lot of math here
	// don't ask me to elaborate, it took me modeling, heavy thinking and plenty of frustration
	constructor(
		targetX: number,
		targetY: number,
		private inflictsDamage: (Entity & InflictsDamage)[],
		offset_x: number,
		offset_y: number,
	) {
		super(config.canvas_width / 2 + offset_x, 155 + offset_y, 2, 2);
		this.speed = Math.floor(Math.random() * this.speed) + this.speed * 0.75;

		// random offset
		this.targetX = targetX + (Math.floor(Math.random() * this.accuracy * 2) - this.accuracy);
		this.targetY = targetY + (Math.floor(Math.random() * this.accuracy * 2) - this.accuracy);

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
		console.log(this.inflictsDamage.length);

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
		r.drawRect(this.x, this.y, this.w, this.h, this.color);
	}
}
