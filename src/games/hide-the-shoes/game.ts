import type { Renderer } from '../../engine/core/renderer.ts';
import { config } from '../../engine/config.ts';
import { Entity } from '../../engine/entity/entity.ts';
import { Scene } from '../../engine/scenes/scene.ts';
import type { Input } from '../../engine/core/input.ts';
import { signal } from '../../engine/utils/signal.ts';
import { ScoreDisplay } from '../../engine/entity/scoreDisplay.ts';
import { Game } from '../../engine/core/game.ts';
import { MenuScene } from '../../engine/scenes/menuScene.ts';

const GRID_SIZE = 40;
const COLS = 6;
const ROWS = 4;
const OFFSET_Y = 20;

enum TileStatus {
	CLEAN,
	ACTIVE,
	COMPLETE,
}

class Tile {
	public status: TileStatus = TileStatus.CLEAN;

	constructor(
		public gx: number,
		public gy: number,
	) {}

	render(r: Renderer) {
		const x = this.gx * GRID_SIZE;
		const y = this.gy * GRID_SIZE + OFFSET_Y;

		r.drawRect(x, y, GRID_SIZE, GRID_SIZE, config.theme.colors.blue);
		r.drawRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2, config.theme.colors.dark_blue);

		if (this.status === TileStatus.ACTIVE) {
			r.drawRect(x, y, GRID_SIZE, GRID_SIZE, config.theme.colors.dark_purple);
		} else if (this.status === TileStatus.COMPLETE) {
			r.drawRect(x, y, GRID_SIZE, GRID_SIZE, config.theme.colors.dark_red);
		}
	}
}

class Student extends Entity {
	public gx: number = 0;
	public gy: number = 0;

	constructor() {
		super(0, 0, GRID_SIZE, GRID_SIZE);
	}

	move(dx: number, dy: number) {
		this.gx += dx;
		this.gy += dy;

		this.gx = Math.max(0, Math.min(COLS - 1, this.gx));
		this.gy = Math.max(0, Math.min(ROWS - 1, this.gy));
	}

	update() {
		this.x = this.gx * GRID_SIZE;
		this.y = this.gy * GRID_SIZE + OFFSET_Y;
	}

	render(r: Renderer) {
		r.drawRect(
			this.x + 10,
			this.y + 10,
			this.w - 20,
			this.h - 20,
			config.theme.colors.dark_green,
		);
	}
}

type GameState = 'start' | 'running' | 'end';

class GameScene extends Scene {
	private tiles: Tile[] = [];
	private student: Student;
	private state: GameState = 'running';
	private score = signal(0);

	private attackTimer: number = 0;
	private nextAttackTimer: number = 2.0;

	private isAttacking: boolean = false;

	private scoreDisplay = new ScoreDisplay(this.score);

	constructor(i: Input) {
		super();
		this.student = new Student();

		for (let y = 0; y < ROWS; y++) {
			for (let x = 0; x < COLS; x++) {
				this.tiles.push(new Tile(x, y));
			}
		}

		i.onKeyDown((k) => {
			if (this.state !== 'running') {
				return;
			}
			if (config.keys.up.includes(k)) {
				this.student.move(0, -1);
			} else if (config.keys.down.includes(k)) {
				this.student.move(0, 1);
			} else if (config.keys.left.includes(k)) {
				this.student.move(-1, 0);
			} else if (config.keys.right.includes(k)) {
				this.student.move(1, 0);
			}
			this.checkImmediateCollision();
		});
	}

	private getDifficulty() {
		const t = Math.min(this.score() / 3000, 1);
		return 1 - Math.pow(1 - t, 2);
	}

	private checkImmediateCollision() {
		const currentTile = this.tiles.find(
			(t) => t.gx === this.student.gx && t.gy === this.student.gy,
		);
		if (currentTile && currentTile.status === TileStatus.COMPLETE) {
			this.student.update();
			this.state = 'end';
		}
	}

	private triggerTeacherAttack() {
		const difficulty = this.getDifficulty();

		const isRow = Math.random() > 0.5;
		const index = Math.floor(Math.random() * (isRow ? ROWS : COLS));

		const lineTiles = this.tiles.filter((t) => (isRow ? t.gy === index : t.gx === index));
		const candidates = this.tiles.filter((t) => !lineTiles.includes(t));

		const extraTilesCount = Math.floor(2 + difficulty * 12);

		const randomTiles: Tile[] = [];
		for (let i = 0; i < extraTilesCount; i++) {
			if (candidates.length === 0) {
				break;
			}

			const rIdx = Math.floor(Math.random() * candidates.length);
			randomTiles.push(candidates.splice(rIdx, 1)[0]);
		}
		let allTargetTiles = [...lineTiles, ...randomTiles];

		if (allTargetTiles.length >= this.tiles.length) {
			const randomSafe = allTargetTiles[Math.floor(Math.random() * allTargetTiles.length)];
			allTargetTiles = allTargetTiles.filter((t) => t !== randomSafe);
		}
		this.excecuteAttack(allTargetTiles);
	}

	private excecuteAttack(affected: Tile[]) {
		const difficulty = this.getDifficulty();

		const warningTime = 1000 - difficulty * 400;
		const dangerTime = 600 - difficulty * 250;

		this.isAttacking = true;

		affected.forEach((t) => (t.status = TileStatus.ACTIVE));

		setTimeout(() => {
			affected.forEach((t) => (t.status = TileStatus.COMPLETE));
			const isHit = affected.some(
				(t) => t.gx === this.student.gx && t.gy === this.student.gy,
			);

			if (isHit) {
				this.state = 'end';
				this.isAttacking = false;
				return;
			}

			this.score.update((v) => v + 100);
			setTimeout(() => {
				if (this.state === 'running') {
					affected.forEach((t) => (t.status = TileStatus.CLEAN));
				}
				this.isAttacking = false;
			}, dangerTime);
		}, warningTime);
	}

	update(dt: number) {
		const difficulty = this.getDifficulty();
		const attackInterval = 1.5 - difficulty * 1.2;

		if (this.state !== 'running') {
			return;
		}
		this.student.update();
		this.checkImmediateCollision();

		if (!this.isAttacking) {
			this.attackTimer += dt;
			if (this.attackTimer >= attackInterval) {
				this.triggerTeacherAttack();
				this.attackTimer = 0;
			}
		}
	}

	render(r: Renderer) {
		this.tiles.forEach((t) => t.render(r));
		this.student.render(r);
		this.scoreDisplay.render(r);

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
export class HideTheShoes extends Game {
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
