import { Entity } from '../../engine/entity/entity.ts';
import { config } from '../../engine/config.ts';
import type { Renderer } from '../../engine/core/renderer.ts';
import { Scene } from '../../engine/scenes/scene.ts';
import type { Input } from '../../engine/core/input.ts';
import { Game } from '../../engine/core/game.ts';
import { MenuScene } from '../../engine/scenes/menuScene.ts';
import { ScoreDisplay } from '../../engine/entity/scoreDisplay.ts';
import { HeartDisplay } from '../../engine/entity/heartDisplay.ts';
import { signal } from '../../engine/utils/signal.ts';

type Subject = 'POS' | 'WMC' | 'SYP' | 'DBI';
type Direction = 'top' | 'right' | 'bottom' | 'left';
const SUBJECT_COLORS = {
	POS: config.theme.colors.blue,
	WMC: config.theme.colors.green,
	SYP: config.theme.colors.yellow,
	DBI: config.theme.colors.purple,
};

class Cube extends Entity {
	private sides: Subject[] = ['POS', 'WMC', 'SYP', 'DBI'];

	constructor() {
		super(config.canvas_width / 2 - 30, config.canvas_height / 2 - 30, 60, 60);
	}

	rotateRight() {
		const last = this.sides.pop()!;
		this.sides.unshift(last);
	}

	rotateLeft() {
		const first = this.sides.shift()!;
		this.sides.push(first);
	}
	rotate180() {
		this.rotateLeft();
		this.rotateLeft();
	}

	getSubjectAt(direction: Direction): Subject {
		switch (direction) {
			case 'top':
				return this.sides[0];
			case 'right':
				return this.sides[1];
			case 'bottom':
				return this.sides[2];
			case 'left':
				return this.sides[3];
		}
	}

	render(r: Renderer) {
		r.drawRect(this.x, this.y, this.w, this.h, config.theme.colors.dark_gray);

		r.text(this.sides[0], this.x + 15, this.y + 15, SUBJECT_COLORS[this.sides[0]]);
		r.text(this.sides[1], this.x + 35, this.y + 35, SUBJECT_COLORS[this.sides[1]]);
		r.text(this.sides[2], this.x + 15, this.y + 55, SUBJECT_COLORS[this.sides[2]]);
		r.text(this.sides[3], this.x - 5, this.y + 35, SUBJECT_COLORS[this.sides[3]]);
	}
}

class SubjectProjectile extends Entity {
	type: Subject;
	originDir: Direction;
	speed: number = 50;

	constructor(type: Subject, originDir: Direction) {
		let startX = 0;
		let startY = 0;
		const size = 30;

		switch (originDir) {
			case 'top':
				startX = config.canvas_width / 2 - size / 2;
				startY = -size;
				break;
			case 'right':
				startX = config.canvas_width;
				startY = config.canvas_height / 2 - size / 2;
				break;
			case 'bottom':
				startX = config.canvas_width / 2 - size / 2;
				startY = config.canvas_height;
				break;
			case 'left':
				startX = -size;
				startY = config.canvas_height / 2 - size / 2;
				break;
		}
		super(startX, startY, size, size);
		this.type = type;
		this.originDir = originDir;
	}

	update(dt: number) {
		switch (this.originDir) {
			case 'top':
				this.y += this.speed * dt;
				break;
			case 'right':
				this.x -= this.speed * dt;
				break;
			case 'bottom':
				this.y -= this.speed * dt;
				break;
			case 'left':
				this.x += this.speed * dt;
				break;
		}
	}

	render(r: Renderer) {
		const color = SUBJECT_COLORS[this.type];

		r.drawRect(this.x, this.y, this.w, this.h, color);
		r.text(this.type, this.x + 2, this.y + 20, config.theme.colors.black);
	}
}

type GameState = 'start' | 'running' | 'end';

class GameScene extends Scene {
	private cube: Cube;
	private projectiles: SubjectProjectile[] = [];
	private score = signal(0);
	private lives = signal(3);
	private state: GameState = 'running';

	private spawnTimer: number = 0;
	private spawnInterval: number = 2.0;

	private scoreDisplay = new ScoreDisplay(this.score);
	private heartDisplay = new HeartDisplay(this.lives);

	private minSpawnGap = 0.6;
	private timeSinceLastSpawn = 0;

	private lastSubject: Subject | null = null;

	constructor(private i: Input) {
		super();
		this.cube = new Cube();

		i.onKeyDown((k) => {
			if (config.keys.left.includes(k)) {
				this.cube.rotateLeft();
			} else if (config.keys.right.includes(k)) {
				this.cube.rotateRight();
			} else if (config.keys.up.includes(k)) {
				this.cube.rotate180();
			} else if (config.keys.down.includes(k)) {
				this.cube.rotate180();
			}
		});
	}

	update(dt: number, input: Input) {
		if (this.state === 'end') {
			return;
		}

		this.handleInput(input);

		this.spawnTimer += dt;
		this.timeSinceLastSpawn += dt;

		if (this.spawnTimer >= this.spawnInterval) {
			if (this.timeSinceLastSpawn >= this.minSpawnGap) {
				this.spawnProjectile();
				this.spawnTimer = 0;
				this.timeSinceLastSpawn = 0;

				this.spawnInterval = Math.max(0.8, this.spawnInterval * 0.98);
			}
		}
		for (let i = this.projectiles.length - 1; i >= 0; i--) {
			const p = this.projectiles[i];
			p.update(dt);

			if (p.collidesWith(this.cube)) {
				const target = this.cube.getSubjectAt(p.originDir);

				if (p.type === target) {
					this.score.update((v) => v + 100);
					console.log('scored');
				} else {
					this.lives.update((v) => v - 1);
					console.log('lost live');
				}
				this.projectiles.splice(i, 1);
			}
		}
		if (this.lives() <= 0) {
			this.state = 'end';
		}
	}

	private handleInput(input: Input) {}

	private spawnProjectile() {
		const subjects: Subject[] = ['POS', 'WMC', 'SYP', 'DBI'];
		const directions: Direction[] = ['top', 'right', 'bottom', 'left'];

		const availableSubjects = subjects.filter((s) => s !== this.lastSubject);

		const randomSubject =
			availableSubjects[Math.floor(Math.random() * availableSubjects.length)];
		const randomDir = directions[Math.floor(Math.random() * directions.length)];

		this.lastSubject = randomSubject;

		const p = new SubjectProjectile(randomSubject, randomDir);
		this.projectiles.push(p);
	}
	render(r: Renderer) {
		this.cube.render(r);
		for (const p of this.projectiles) {
			p.render(r);
		}
		this.scoreDisplay.render(r);
		this.heartDisplay.render(r);

		if (this.state === 'end') {
			r.drawRect(0, 0, config.canvas_width, config.canvas_height, 'rgba(0,0,0,0.7)');
			r.advancedText(
				'Game Over',
				config.canvas_width / 2,
				config.canvas_height / 2,
				config.theme.colors.red,
				{ textAlign: 'center', textBaseline: 'middle' },
			);
		}
	}
}

export class FillTheRepo extends Game {
	constructor() {
		super();
		this.scene = new MenuScene(() => {
			this.scene = new GameScene(this.input);
		});
	}
	reset() {
		this.scene = new GameScene(this.input);
	}
}
