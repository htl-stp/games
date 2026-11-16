import { Entity } from '@engine/entity/entity.ts';
import { config } from '@engine/config.ts';
import type { Vulnerable } from '@games/cheat-and-flee/vulnerable.ts';
import type { Renderer } from '@engine/core/renderer.ts';
import type { GameScene } from '@games/cheat-and-flee/game.ts';
import type { Projectile } from '@games/cheat-and-flee/projectile.ts';
import { Bullet } from '@games/cheat-and-flee/weapons/bullets.ts';

export class Rocket extends Entity implements Projectile {
	color = config.theme.colors.red;
	speed = 250;
	lifetime = (2000 * 300) / this.speed; // in milliseconds

	targetX = 0;
	targetY = 0;

	// direction to go
	dirX = 0;
	dirY = 0;

	damage: number = 180;
	explosion_size_multiplier = 5;
	accuracy: number = 0;

	exploded = false;

	// NOTE: there's a lot of math here
	// don't ask me to elaborate, it took me modeling, heavy thinking and plenty of frustration
	constructor(
		targetX: number,
		targetY: number,
		private gamescene: GameScene,
		offset_x: number,
		offset_y: number,
	) {
		super(config.canvas_width / 2 + offset_x, 155 + offset_y, 10, 10);

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
	handleCollisions(): void {
		for (let i = this.gamescene.vulnerables.length - 1; i >= 0; i--) {
			const vulnerable = this.gamescene.vulnerables[i];
			if (this.collidesWith(vulnerable)) {
				// send out shrapnel
				this.explode();
				vulnerable.takeDamage(this.damage);

				this.kill();
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
		}	}

	explode(): void {
		// send out shrapnel in all directions
		const radius = 10;
		const amount_of_bullets = 200;

		for (let i = 0; i < amount_of_bullets; i++) {
			const theta = (2 * Math.PI * i) / amount_of_bullets;
			const x = this.x * radius * Math.cos(theta);
			const y = this.y * radius * Math.sin(theta);
			this.gamescene.weapons.push(new Bullet(x,y,this.gamescene, 0,0, this.x, this.y, 300, 100, this.damage*0.8));
		}

		setTimeout(() => {
			for (let i = 0; i < amount_of_bullets; i++) {
				const theta = (2 * Math.PI * i) / amount_of_bullets;
				const x = this.x * radius * Math.cos(theta);
				const y = this.y * radius * Math.sin(theta);
				this.gamescene.weapons.push(
					new Bullet(x, y, this.gamescene, 0, 0, this.x, this.y, 300, 150, this.damage * 0.2),
				);
			}
		}, 100);
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
