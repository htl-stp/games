import type { Vulnerable } from '@games/cheat-and-flee/vulnerable.ts';
import type { Entity } from '@engine/entity/entity.ts';

export interface Projectile {
	color: string;

	speed: number;
	lifetime: number;
	damage: number;
	accuracy: number;

	targetX: number;
	targetY: number;

	dirX: number;
	dirY: number;

	explode(): void;
	handleCollisions(): void;
	kill(): void;
	handleMovement(delta: number): void;
	collidesWith(other: Entity & Vulnerable): boolean;
}
