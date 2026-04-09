import { Entity } from '../../engine/entity/entity.ts';
import { config } from '../../engine/config.ts';
import { type Renderer } from '../../engine/core/renderer.ts';
import { Scene } from '../../engine/scenes/scene.ts';
import { signal } from '../../engine/utils/signal.ts';
import { ScoreDisplay } from '../../engine/entity/scoreDisplay.ts';
import type { Input } from '../../engine/core/input.ts';
import { Game } from '../../engine/core/game.ts';
import { MenuScene } from '../../engine/scenes/menuScene.ts';

class Haeusler extends Entity {
	private nextPosY: number;
	public speed: number = 100;
	public difficulty: number = 1.0;

	constructor() {
		super(config.canvas_width - 100, config.canvas_height / 2, 40, 50);
		this.nextPosY = this.y;
	}

	update(dt: number) {
		const currentSpeed = this.speed * this.difficulty;

		if (this.y < this.nextPosY) {
			this.y += currentSpeed * dt;
		}
		if (this.y > this.nextPosY) {
			this.y -= currentSpeed * dt;
		}

		if (Math.abs(this.y - this.nextPosY) < 5) {
			this.nextPosY = Math.random() * (config.canvas_height - this.h);
		}
	}

	render(r: Renderer) {
		r.drawRect(this.x, this.y, this.w, this.h, config.theme.colors.red);

		r.drawRect(this.x - 200, this.y, 200, this.h, 'rgba(0,255,0,0.4)');
	}
}

class Student extends Entity {
	private verticalSpeed: number = 250;
	private horizontalPushSpeed = 300;

	constructor(x: number, y: number) {
		super(x, y, 30, 30);
	}

	updatePosition(dt: number, inSlipstream: boolean, targetX: number, difficulty: number) {
		if (inSlipstream) {
			const targetPos = targetX - 30;
			if (this.x < targetPos) {
				this.x += this.horizontalPushSpeed * dt;
			}
		} else {
			const driftPower = 250 * difficulty;
			this.x -= driftPower * dt;
		}
	}

	moveUp(dt: number) {
		if (this.y > 0) {
			this.y -= this.verticalSpeed * dt;
		}
	}

	moveDown(dt: number) {
		if (this.y + this.h < config.canvas_height) {
			this.y += this.verticalSpeed * dt;
		}
	}

	render(r: Renderer) {
		r.drawRect(this.x, this.y, this.w, this.h, config.theme.colors.blue);
	}
}

type GameState = 'start' | 'running' | 'end';

class GameScene extends Scene {
	private state: GameState = 'running';
	private haeusler: Haeusler;
	private student: Student;

	private difficulty: number = 1.0;
	private score = signal(0);
	private scoreDisplay = new ScoreDisplay(this.score);

	private timer: number = 0;

	constructor(input: Input) {
		super();

		this.haeusler = new Haeusler();

		this.student = new Student(config.canvas_width - 150, config.canvas_height / 2);
	}

	private checkSlipstrem(): boolean {
		const slipstreamXMin = this.haeusler.x - 200;
		const slipstreamXMax = this.haeusler.x;

		const horizontalMatch =
			this.student.x + this.student.w > slipstreamXMin && this.student.x < slipstreamXMax;

		const tolerance = 15;

		const verticalMatch =
			this.student.y > this.haeusler.y - tolerance &&
			this.student.y + this.student.h < this.haeusler.y + this.haeusler.h + tolerance;

		return horizontalMatch && verticalMatch;
	}

	update(dt: number, input: Input) {
		if (this.state === 'end') {
			return;
		}
		if (this.student.x + this.student.w <= 0) {
			this.state = 'end';
		}
		this.difficulty += 0.02 * dt;
		this.haeusler.difficulty = this.difficulty;

		if (input.isDown(config.keys.up)) {
			this.student.moveUp(dt);
		}
		if (input.isDown(config.keys.down)) {
			this.student.moveDown(dt);
		}

		this.haeusler.update(dt);

		const inSlipstream = this.checkSlipstrem();
		this.student.updatePosition(dt, inSlipstream, this.haeusler.x, this.difficulty);

		this.timer += dt;
		if (this.timer >= 1) {
			this.score.update((v) => v + 100);
			this.timer = 0;
		}
	}

	render(r: Renderer) {
		this.drawTrack(r);

		this.haeusler.render(r);
		this.student.render(r);

		this.scoreDisplay.render(r);

		r.advancedText(`Tempo: ${this.difficulty.toFixed(1)}x`, 150, 7, config.theme.colors.white, {
			textAlign: 'left',
			textBaseline: 'top',
		});

		if (this.state === 'end') {
			r.advancedText(
				'GAME OVER',
				config.canvas_width / 2,
				config.canvas_height / 2 - 20,
				config.theme.colors.red,
				{ textAlign: 'center', textBaseline: 'middle' },
			);
		}
	}

	private drawTrack(r: Renderer) {
		r.drawRect(0, 0, 5, config.canvas_height, config.theme.colors.red);
	}
}

export class RunningWithHaeusler extends Game {
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
