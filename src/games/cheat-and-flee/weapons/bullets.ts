import { config } from '@engine/config.ts';
import type { Vulnerable } from '@games/cheat-and-flee/vulnerable.ts';
import type { Renderer } from '@engine/core/renderer.ts';
import type { GameScene } from '@games/cheat-and-flee/game.ts';
import type { Projectile } from '@games/cheat-and-flee/projectile.ts';
import { Entity } from '@engine/entity/entity.ts';

export class Bullet extends Entity implements Projectile {
	color = config.theme.colors.yellow;
	speed = 400;

	// the more speed, the shorter the lifetime
	// 2 seconds, for speed 300
	lifetime = (2000 * 300) / this.speed; // in milliseconds

	targetX = 0;
	targetY = 0;

	// direction to go
	dirX = 0;
	dirY = 0;

	damage: number = 10;
	explosion_size_multiplier: number = 2;

	accuracy: number = 20; // accuracy, 0 = pinpoint

	// NOTE: there's a lot of math here
	// don't ask me to elaborate, it took me modeling, heavy thinking and plenty of frustration
	constructor(
		targetX: number,
		targetY: number,
		private gamescene: GameScene,
		offset_x: number,
		offset_y: number,
		private x_origin_optional: number,
		private y_origin_optional: number,
		private speed_optional: number,
		private lifetime_optional: number,
		private damage_optional: number,
	) {
		if (Number.isNaN(x_origin_optional)|| Number.isNaN(y_origin_optional)) {
			super(config.canvas_width / 2 + offset_x, 155 + offset_y, 2, 2);
		} else {
			super(x_origin_optional + offset_x, y_origin_optional + offset_y, 2, 2);
		}

		if (Number.isNaN(speed_optional)) {
			this.speed = Math.floor(Math.random() * this.speed) + this.speed * 0.75;
		} else {
			this.speed = speed_optional;
		}

		if (!(Number.isNaN(lifetime_optional))) {
			this.lifetime = lifetime_optional;
		}
		if (!Number.isNaN(damage_optional)) {
			this.damage = damage_optional;
		}



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

	explode(): void {
		this.color = config.theme.colors.white;

		this.x += this.dirX * (this.w / 2);
		this.y += this.dirY * (this.h / 2);

		this.w = this.w * this.explosion_size_multiplier;
		this.h = this.h * this.explosion_size_multiplier;
	}

	timer = 0;
	update(delta: number) {
		this.handleMovement(delta);
		this.handleCollisions();

		if (this.timer >= this.lifetime) {
			for (let i = 0; i < this.gamescene.weapons.length; i++) {
				if (this.gamescene.weapons[i] === this) {
					this.gamescene.weapons.splice(i, 1);
					return;
				}
			}
		}
		this.timer += delta * 1000;
	}

	handleCollisions(): void {
		for (let i = this.gamescene.vulnerables.length - 1; i >= 0; i--) {
			const vulnerable = this.gamescene.vulnerables[i];
			if (this.collidesWith(vulnerable)) {
				vulnerable.takeDamage(this.damage);
				this.explode();
				setTimeout(() => {
					this.kill();
				}, 2);
				return;
			}
		}
	}

	kill(): void {
		for (let i = this.gamescene.weapons.length - 1; i >= 0; i--) {
			if (this.gamescene.weapons[i] === this) {
				this.gamescene.weapons.splice(i, 1);
				return;
			}
		}
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
