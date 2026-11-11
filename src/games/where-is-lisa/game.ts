import { Game } from '@engine/core/game.ts';
import { MenuScene } from '@engine/scenes/menuScene.ts';
import { Scene } from '@engine/scenes/scene.ts';
import { type Input } from '@engine/core/input.ts';
import { config } from '@engine/config.ts';
import { Entity } from '@engine/entity/entity.ts';
import { type Renderer } from '@engine/core/renderer.ts';
import { SoundAsset } from '@engine/assets/asset.ts';
import type { AssetLoader } from '@engine/assets/assetloader.ts';

import song from '@assets/sounds/songs/the_search.wav';
import game_over from '@assets/sounds/sound_effects/game_over.wav';

type GameState = 'running' | 'game over';
const songAsset = new SoundAsset(song);
const gameOverAsset = new SoundAsset(game_over);

const randInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (value: number, min: number, max: number): number =>
	Math.min(Math.max(value, min), max);
const PLAYER_SPEED: number = 250;
const WIDTH: number = 240;
const HEIGHT: number = 180;
const ENEMY_SPEED = 300;
const directions = ['bottom left', 'bottom right', 'top left', 'top right'];
let stage = 1;
const NextDirectionIntervall = 2;

class Student extends Entity {
	private direction: string;
	private boost: number;
	constructor(direction: string) {
		super(0, 0, 10, 10);
		this.direction = direction;
		this.resetPosition();
		this.boost = randInt(5, 10) / 10;
	}
	update(delta: number) {
		super.update(delta);
		const speed = ((stage + 5) / 50) * ENEMY_SPEED * this.boost * delta;
		switch (this.direction) {
			case 'bottom left':
				if (this.x < 0 || this.y > HEIGHT) {
					this.resetPosition();
				}
				this.x -= speed;
				this.y += speed;
				break;
			case 'bottom right':
				if (this.x > WIDTH || this.y > HEIGHT) {
					this.resetPosition();
				}
				this.x += speed;
				this.y += speed;
				break;
			case 'top left':
				if (this.x < 0 || this.y < 0) {
					this.resetPosition();
				}
				this.x -= speed;
				this.y -= speed;
				break;
			case 'top right':
				if (this.x > WIDTH || this.y < 0) {
					this.resetPosition();
				}
				this.x += speed;
				this.y -= speed;
				break;
		}
	}
	render(r: Renderer) {
		r.drawRect(this.x, this.y, this.w, this.h, config.theme.colors.red);
	}

	public resetPosition() {
		this.direction = directions[randInt(0, ((stage / NextDirectionIntervall) % 4) - 1)];
		switch (this.direction) {
			case 'bottom left':
				this.x = randInt(WIDTH - 10, 2 * WIDTH - 10);
				this.y = randInt(-HEIGHT - 10, 0);
				break;
			case 'bottom right':
				this.x = randInt(-WIDTH - 10, 0);
				this.y = randInt(-HEIGHT - 10, 0);
				break;
			case 'top left':
				this.x = randInt(WIDTH, 2 * WIDTH - 10);
				this.y = randInt(HEIGHT, 2 * HEIGHT - 10);
				break;
			case 'top right':
				this.x = randInt(-WIDTH - 10, 0);
				this.y = randInt(HEIGHT, 2 * HEIGHT - 10);
				break;
		}
	}
}

class Lisa extends Student {
	render(r: Renderer) {
		r.drawRect(this.x, this.y, this.w, this.h, config.theme.colors.green);
	}
}

class Player extends Entity {
	constructor() {
		super(WIDTH / 2 - 5, HEIGHT / 2 - 5, 5, 5);
	}
	update(delta: number) {
		super.update(delta);
		this.x = clamp(this.x, 0, WIDTH - this.w);
		this.y = clamp(this.y, 0, HEIGHT - this.h);
	}
	render(r: Renderer) {
		r.drawRect(this.x, this.y, this.w, this.h, config.theme.colors.purple);
	}
}

class GameScene extends Scene {
	state: GameState = 'running';
	player: Player = new Player();
	students: Student[];
	lisa: Lisa;
	constructor() {
		super();
		this.students = [];
		this.lisa = new Lisa(directions[randInt(0, ((stage / NextDirectionIntervall) % 4) - 1)]);
		songAsset.play();
		this.state = 'running';
		for (let j = 0; j < 9; j++) {
			this.students.push(new Student('bottom left'));
		}
	}

	update(delta: number, input: Input) {
		switch (this.state) {
			case 'game over':
				if (!gameOverAsset.isPlaying()) {
					gameOverAsset.play();
				}
				return;
			case 'running':
				break;
		}
		if (!songAsset.isPlaying()) {
			songAsset.play();
		}
		this.lisa.update(delta);
		super.update(delta, input);
		for (const stone of this.students) {
			stone.update(delta);
			if (stone.collidesWith(this.player)) {
				this.state = 'game over';
			}
		}
		if (this.lisa.collidesWith(this.player)) {
			this.nextStage();
		}
		if (input.isDown(config.keys.right)) {
			this.player.x += delta * PLAYER_SPEED;
		}
		if (input.isDown(config.keys.left)) {
			this.player.x -= delta * PLAYER_SPEED;
		}
		if (input.isDown(config.keys.up)) {
			this.player.y -= delta * PLAYER_SPEED;
		}
		if (input.isDown(config.keys.down)) {
			this.player.y += delta * PLAYER_SPEED;
		}
		this.player.update(delta);
	}

	render(renderer: Renderer) {
		super.render(renderer);
		this.lisa.render(renderer);
		for (const stone of this.students) {
			stone.render(renderer);
		}
		this.player.render(renderer);
		if (this.state === 'game over') {
			renderer.advancedText(
				'Game Over',
				config.canvas_width / 2,
				config.canvas_height / 2,
				config.theme.colors.white,
				{ textAlign: 'center', textBaseline: 'middle' },
			);
			songAsset.pause();
		}
		const timeText = 'Stage: ' + stage;
		renderer.advancedText(timeText, 160, 7, config.theme.colors.white, {
			textAlign: 'left',
			textBaseline: 'top',
		});
	}

	private nextStage() {
		this.lisa.resetPosition();
		for (const student of this.students) {
			student.resetPosition();
		}
		this.students.push(new Student(''));
		stage++;
	}
}

export class WhereIsLisa extends Game {
	constructor() {
		super();
		this.scene = new MenuScene(() => {
			this.scene = new GameScene();
		});
	}
	reset() {
		this.scene = new GameScene();
		stage = 1;
	}
	loadAssets(loader: AssetLoader) {
		super.loadAssets(loader);

		loader.add(songAsset);
		loader.add(gameOverAsset);
	}
}
