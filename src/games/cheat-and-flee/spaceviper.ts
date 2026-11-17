import { Entity } from '@engine/entity/entity.ts';
import type { Vulnerable } from '@games/cheat-and-flee/vulnerable.ts';
import { config } from '@engine/config.ts';
import type { Renderer } from '@engine/core/renderer.ts';
import type { GameScene } from '@games/cheat-and-flee/game.ts';

// a tiny tiny enemy
export class SpaceViper extends Entity implements Vulnerable {
	speed: number = 50;

	dirX = 0;
	dirY = 0;

	HP: number = 20;

	circling: boolean = false;

	// the mothership
	targetX = config.canvas_width / 2;
	targetY = 165;

	constructor(
		x: number,
		offset_x: number,
		offset_y: number,
		private gamescene: GameScene,
	) {
		super(x + offset_x, -60 + offset_y, 6, 6);

		const dx = this.targetX - this.x;
		const dy = this.targetY - this.y;

		this.dirX = dx / dy;
		this.dirY = -1 * Math.random();

		this.circling = Math.random() > 0.5;
	}

	render(r: Renderer) {
		r.drawRect(this.x, this.y, this.w, this.h, config.theme.colors.purple);
	}

	update(delta: number) {
		this.handleMovement(delta);
	}

	handleMovement(delta: number) {
		if (this.circling) {
			this.x += this.dirX * this.speed * delta * Math.PI;
			this.y -= this.dirY * this.speed * delta;
		} else {
			this.x += this.dirX * this.speed * delta;
			this.y -= this.dirY * this.speed * delta;
		}
	}

	takeDamage(damage: number): void {
		this.HP -= damage;
		if (this.HP <= 0) {
			this.kill();
		}
	}

	kill() {
		for (let i = this.gamescene.vulnerables.length - 1; i >= 0; i--) {
			if (this.gamescene.vulnerables[i] === this) {
				this.gamescene.vulnerables.splice(i, 1);
				return;
			}
		}
	}
}
