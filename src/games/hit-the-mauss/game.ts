import { Entity } from '../../engine/entity/entity.ts';
import type { Renderer } from '../../engine/core/renderer.ts';
import type { Input } from '../../engine/core/input.ts';
import { config } from '../../engine/config.ts';
import { Game } from '../../engine/core/game.ts';
import { Scene } from '../../engine/scenes/scene.ts';
import { MenuScene } from '../../engine/scenes/menuScene.ts';
import { signal } from '../../engine/utils/signal.ts';
import { HeartDisplay } from '../../engine/entity/heartDisplay.ts';
import { ScoreDisplay } from '../../engine/entity/scoreDisplay.ts';

class Mauss extends Entity {
	private active = false;
	private timer = 0;
	private spawnChance = 0.2;

	constructor(x: number, y: number) {
		const size = 20;
		super(x, y, size, size);
	}

	spawn() {
		if (Math.random() < this.spawnChance) {
			this.active = true;
			this.timer = 2;
			console.log('Mauss Spawned');
			console.log('Spawnchance: ' + this.spawnChance);
		}
	}

	update(dt: number): boolean {
		if (this.active) {
			this.timer -= dt;
			if (this.timer <= 0) {
				this.active = false;
				console.log('Mauss despawned');
				return true;
			}
		}
		return false;
	}

	render(r: Renderer) {
		if (!this.active) {
			r.drawRect(this.x, this.y, this.w, this.h, config.theme.colors.black);
		} else {
			r.drawRect(this.x, this.y, this.w, this.h, config.theme.colors.red);
		}
	}

	getHit() {
		this.active = false;
	}

	peek() {
		this.active = true;
	}

	isActive() {
		return this.active;
	}

	setSpawnChance(value: number) {
		this.spawnChance = value;
	}
}

class Hammer extends Entity {
	speed = 250;
	private ready = true;

	constructor() {
		super(config.canvas_width / 2 - 30 / 2, 50, 30, 50);
	}

	render(r: Renderer) {
		r.drawRect(this.x, this.y, this.w, this.h, config.theme.colors.blue);
	}
}

class HitBox extends Entity {
	constructor(x: number, y: number, w: number, h: number) {
		super(x, y, w, h);
	}
}

type GameState = 'start' | 'running' | 'end';

class GameScene extends Scene {
	lives = signal<number>(3);

	entities: Entity[] = [];
	score = signal<number>(0);
	gamestate: GameState = 'running';

	timer: number = 0;

	movementLocked: boolean = false;
	lockTimer: number = 0;
	hitcooldown: number = 0.5;

	difficultyTimer: number = 0;

	spawnInterval: number = 1;

	constructor() {
		super();
		this.entities.push(new Hammer());

		const y = 120;

		for (let i = 0; i < 4; i++) {
			const x = 40 + i * 50;
			const m = new Mauss(x, y);
			this.entities.push(m);
		}

		this.entities.push(new HeartDisplay(this.lives));
		this.entities.push(new ScoreDisplay(this.score));
	}

	render(r: Renderer) {
		for (const e of this.entities) {
			e.render(r);
		}

		if (this.gamestate === 'end') {
			r.advancedText(
				'Game Over',
				config.canvas_width / 2,
				config.canvas_height / 2,
				config.theme.colors.white,
				{ textAlign: 'center', textBaseline: 'middle' },
			);
		}
	}

	update(dt: number, input: Input) {
		this.timer += dt;
		this.difficultyTimer += dt;
		this.spawnInterval = Math.max(0.3, 1 - this.difficultyTimer * 0.02);

		if (this.movementLocked) {
			this.lockTimer -= dt;
			if (this.lockTimer <= 0) {
				this.movementLocked = false;
			}
		}
		if (this.gamestate === 'running') {
			for (const e of this.entities) {
				if (e instanceof Mauss) {
					const result = e.update(dt);

					if (result) {
						this.lives.update((v) => v - 1);
						console.log('Leben verloren');

						if (this.lives() <= 0) {
							console.log('Game Over');
							this.gamestate = 'end';
						}
					}
				} else {
					e.update(dt);
				}
			}

			if (this.timer > this.spawnInterval) {
				const mausses = this.entities.filter((e) => e instanceof Mauss) as Mauss[];

				const randomMauss = mausses[Math.floor(Math.random() * mausses.length)];

				const difficulty = Math.min(0.5, 0.2 + this.difficultyTimer * 0.01);

				randomMauss.setSpawnChance(difficulty);
				randomMauss.spawn();

				this.timer -= this.spawnInterval;
			}

			this.handleInput(input, dt);
		}
	}

	handleInput(input: Input, dt: number) {
		if (input.isDown(config.keys.confirm)) {
			if (this.gamestate === 'running') {
				this.hitMauss();
			}
		}
		if (!this.movementLocked) {
			if (input.isDown(config.keys.left)) {
				if (this.gamestate === 'running') {
					this.moveLeft(dt);
				}
			}
			if (input.isDown(config.keys.right)) {
				if (this.gamestate === 'running') {
					this.moveRight(dt);
				}
			}
		}
	}

	hitMauss() {
		const hammer = this.entities.find((e) => e instanceof Hammer)!;

		this.movementLocked = true;
		this.lockTimer = this.hitcooldown;

		const hitBox = new HitBox(hammer.x, hammer.y, hammer.w, config.canvas_height);

		const mausses: Mauss[] = [];

		for (const e of this.entities) {
			if (e instanceof Mauss) {
				mausses.push(e);
			}
		}

		for (const m of mausses) {
			if (m.isActive() && hitBox.collidesWith(m)) {
				m.getHit();
				this.score.update((v) => v + 100);
			}
		}
	}

	moveLeft(dt: number) {
		const hammer = this.entities.find((e) => e instanceof Hammer)!;
		if (hammer.x < 20) {
			return;
		}
		hammer.x -= hammer.speed * dt;
	}

	moveRight(dt: number) {
		const hammer = this.entities.find((e) => e instanceof Hammer)!;
		if (hammer.x > config.canvas_width - hammer.w - 20) {
			return;
		}
		hammer.x += hammer.speed * dt;
	}
}

export class HitTheMauss extends Game {
	constructor() {
		super();

		this.scene = new MenuScene(() => {
			this.scene = new GameScene();
		});
	}

	reset() {
		this.scene = new GameScene();
	}
}
