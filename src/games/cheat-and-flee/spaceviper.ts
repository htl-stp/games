// a tiny tiny enemy
import { Entity } from '@engine/entity/entity.ts';
import type { Vulnerable } from '@games/cheat-and-flee/vulnerable.ts';
import { config } from '@engine/config.ts';
import type { Renderer } from '@engine/core/renderer.ts';

export class SpaceViper extends Entity implements Vulnerable {
	speed: number = 50;

	dirX = 0;
	dirY = 0;

	HP: number = 100;

	// the mothership
	targetX = config.canvas_width / 2;
	targetY = 165;

	constructor(
		x: number,
		private vulnerables: (Entity & Vulnerable)[],
		offset_x: number,
		offset_y: number,
	) {
		super(x + offset_x, -60 + offset_y, 6, 6);

		const dx = this.targetX - this.x;
		const dy = this.targetY - this.y;

		this.dirX = dx / dy;
		this.dirY = -1 * Math.random();
	}

	render(r: Renderer) {
		r.drawRect(this.x, this.y, this.w, this.h, config.theme.colors.purple);
	}

	update(delta: number) {
		this.handleMovement(delta);

		console.log(this.vulnerables.length);
	}

	handleMovement(delta: number) {
		if (this.x > config.canvas_width + this.w + 5) {
			this.kill();
		}
		if (this.x < this.w + 5) {
			this.kill();
		}
		if (this.y > config.canvas_height + this.w + 5) {
			this.kill();
		}
		if (this.x < this.w + 5) {
			this.kill();
		}

		this.x += this.dirX * this.speed * delta;
		this.y -= this.dirY * this.speed * delta;
	}

	kill() {
		for (let i = 0; i < this.vulnerables.length; ++i) {
			if (this.vulnerables[i] === this) {
				this.vulnerables.splice(i, 1);
				return;
			}
		}
	}

	collidesWith(other: Entity & Vulnerable): boolean {
		return super.collidesWith(other);
	}

	takeDamage(damage: number): void {
		for (let i = 0; i < this.vulnerables.length; ++i) {
			if (this.vulnerables[i] === this) {
				this.vulnerables.splice(i, 1);

				return;
			}
		}

		this.HP -= damage;
	}
}
