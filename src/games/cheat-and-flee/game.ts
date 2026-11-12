import { Game } from '@engine/core/game.ts';
import { MenuScene } from '@engine/scenes/menuScene.ts';
import type { AssetLoader } from '@engine/assets/assetloader.ts';
import { Scene } from '@engine/scenes/scene.ts';
import { SoundAsset } from '@engine/assets/asset.ts';
import song from '@assets/sounds/songs/midget_shuffles.wav';
import { Entity } from '@engine/entity/entity.ts';
import  { type Renderer } from '@engine/core/renderer.ts';
import { Input } from '@engine/core/input.ts';
import { config } from '@engine/config.ts';
import type { Vulnerable } from '@games/cheat-and-flee/vulnerable.ts';
import type { InflictsDamage } from '@games/cheat-and-flee/inflictsDamage.ts';

class Timer extends Entity {
	ms = 0;
	sec = 0;
	min = 0;
	color = config.theme.colors.white;
	timerRun: boolean = false;
	counterRun: boolean = false;

	constructor() {
		super(230, 10, 0, 0);
	}

	update(delta: number) {
		if (this.timerRun) {
			if (this.ms > 999) {
				this.sec += 1;
				this.ms = 0;
			}
			if (this.sec > 59) {
				this.min += 1;
				this.sec = 0;
			}

			this.ms += delta * 1000;
		}
		if (this.counterRun) {
			if (this.min <= 0 && this.sec <= 0 && this.ms <= 0) {
				this.min = 0;
				this.sec = 0;
				this.ms = 0;
				this.counterRun = false;
				this.color = config.theme.colors.dark_gray;
				this.counterHitZero();
				return;
			}

			if (this.ms < 0) {
				this.sec -= 1;
				this.ms = 999;
			}
			if (this.sec < 0) {
				this.min -= 1;
				this.sec = 59;
			}

			// blink red
			if (this.min <= 0 && this.sec <= 15) {
				if (this.ms <= 500) {
					this.color = config.theme.colors.white;
				} else {
					this.color = config.theme.colors.yellow;
				}
			}
			// blink red
			if (this.min <= 0 && this.sec <= 7) {
				if (this.ms <= 500) {
					this.color = config.theme.colors.white;
				} else {
					this.color = config.theme.colors.red;
				}
			}

			this.ms -= delta * 1000;
		}

		// DEBUG
		// console.log(
		// 	'TIMER: ' +
		// 		String(this.min).padStart(2, '0') +
		// 		':' +
		// 		String(this.sec).padStart(2, '0') +
		// 		':' +
		// 		String(this.ms).padStart(3, '0'),
		// );
	}

	// timer increases from 0
	startTimer() {
		this.min = 0;
		this.sec = 0;
		this.ms = 0;
		this.timerRun = true;
	}
	stopTimer() {
		this.timerRun = false;
	}

	// timer decreases to 0
	startCountdown(minutes: number, seconds: number, milliseconds: number) {
		if (!(minutes <= 59 && minutes >= 0)) {
			throw new Error('Minutes must be withing 0-59!');
		}
		if (!(seconds <= 59 && seconds >= 0)) {
			throw new Error('Seconds must be within 0-59!');
		}
		if (!(milliseconds <= 999 && milliseconds >= 0)) {
			throw new Error('Milliseconds must be within 0-999!');
		}

		this.min = minutes;
		this.sec = seconds;
		this.ms = milliseconds;

		this.counterRun = true;
	}
	stopCountdown() {
		this.counterRun = false;
	}
	counterHitZero() {
		console.log('counterHitZero!');
	}

	render(r: Renderer) {
		r.advancedText(
			String(this.min).padStart(2, '0') +
				':' +
				String(this.sec).padStart(2, '0') +
				':' +
				String(this.ms).padStart(3, '0'),
			this.x,
			this.y,
			this.color,
			{
				textBaseline: 'middle',
				textAlign: 'right',
			},
		);
	}
}

class Rocket extends Entity implements InflictsDamage {
	color = config.theme.colors.red;
	lifetime = 2000; // in milliseconds
	speed = 250;

	targetX = 0;
	targetY = 0;

	// direction to go
	dirX = 0;
	dirY = 0;

	damage: number = 180;
	explosion_size_multiplier = 2;

	// NOTE: there's a lot of math here
	// don't ask me to elaborate, it took me modeling, heavy thinking and plenty of frustration
	constructor(
		targetX: number,
		targetY: number,
		private inflictsDamage: Entity[],
		offset_x: number,
		offset_y: number,
	) {
		super(config.canvas_width / 2 + offset_x, 155 + offset_y, 10, 10);
		this.speed = Math.floor(Math.random() * 250) + 150;
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

	timer = 0;
	update(delta: number) {
		this.handleMovement(delta);

		if (this.timer >= this.lifetime) {
			for (let i = 0; i < this.inflictsDamage.length; i++) {
				if (this.inflictsDamage[i] === this) {
					this.inflictsDamage.splice(i, 1);
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

	collidesWith(other: (Entity & Vulnerable)): boolean {
		return super.collidesWith(other);
	}

	render(r: Renderer) {
		r.drawRect(this.x-this.w/2, this.y, this.w, this.h, this.color);
	}
}

class Bullet extends Entity implements InflictsDamage {
	color = config.theme.colors.yellow;
	lifetime = 500; // in milliseconds
	speed = 2000;

	targetX = 0;
	targetY = 0;

	// direction to go
	dirX = 0;
	dirY = 0;

	damage: number = 10;
	explosion_size_multiplier: number = 5;

	// NOTE: there's a lot of math here
	// don't ask me to elaborate, it took me modeling, heavy thinking and plenty of frustration
	constructor(
		targetX: number,
		targetY: number,
		private inflictsDamage: (Entity & InflictsDamage)[],
		offset_x: number,
		offset_y: number,
	) {
		super(config.canvas_width / 2 + offset_x, 155 + offset_y, 2, 2);
		this.speed = Math.floor(Math.random() * 500) + 200;
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


	timer = 0;
	update(delta: number) {
		this.handleMovement(delta);

		if (this.timer >= this.lifetime) {
			for (let i = 0; i < this.inflictsDamage.length; i++) {
				if (this.inflictsDamage[i] === this) {
					this.inflictsDamage.splice(i, 1);
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

	collidesWith(other: (Entity & Vulnerable)): boolean {
		return super.collidesWith(other);

	}

	render(r: Renderer) {
		r.drawRect(this.x, this.y, this.w, this.h, this.color);
	}
}

class Crosshair extends Entity {
	color = config.theme.colors.green;
	input: Input = new Input();

	// 0 = bullets, 1 = rockets, ...
	mode: number = 0;

	firing: boolean = false;
	constructor(
		private inflictsDamage: (Entity & InflictsDamage)[],
		private gamescene: GameScene,
	) {
		super(config.canvas_width / 2, config.canvas_height / 2, 0, 0);

		this.input.onKeyDown((key) => {
			if (key === ' ') {
				this.firing = !this.firing;
				this.gamescene.mothership.muzzle_color = config.theme.colors.red;
			}
			if (!this.firing) {
				this.gamescene.mothership.muzzle_color = config.theme.colors.black;
			}

			if (key === '1') {
				this.mode = 0;
			}
			if (key === '2') {
				this.mode = 1;
			}
		});
	}

	// all 3 are in proportion to each other
	// e.g. if one is multiplied by 10 then the other 2 are multiplied by 10 as well
	crosshair_gap = 4; // default 4
	crosshair_thickness = 2; // default 2
	crosshair_length = 10; // default 10
	render(r: Renderer) {
		// center dot
		// r.drawRect(this.x, this.y, this.crosshair_thickness, this.crosshair_thickness, this.color);

		// bottom
		r.drawRect(
			this.x,
			this.y + this.crosshair_gap,
			this.crosshair_thickness,
			this.crosshair_length,
			this.color,
		);
		// right
		r.drawRect(
			this.x + this.crosshair_gap,
			this.y,
			this.crosshair_length,
			this.crosshair_thickness,
			this.color,
		);
		// left
		r.drawRect(
			this.x - (this.crosshair_length + this.crosshair_gap / 2),
			this.y,
			this.crosshair_length,
			this.crosshair_thickness,
			this.color,
		);
		// top
		r.drawRect(
			this.x,
			this.y - (this.crosshair_length + this.crosshair_gap / 2),
			this.crosshair_thickness,
			this.crosshair_length,
			this.color,
		);

		// rect top
		r.drawRect(
			this.x - this.crosshair_length + this.crosshair_gap / 2,
			this.y - this.crosshair_gap * 2,
			this.crosshair_gap * 4 + this.crosshair_thickness,
			this.crosshair_gap / 2,
			this.color,
		);
		// rect bottom
		r.drawRect(
			this.x - this.crosshair_length + this.crosshair_gap / 2,
			this.y + this.crosshair_gap * 2,
			this.crosshair_gap * 4 + this.crosshair_thickness,
			this.crosshair_gap / 2,
			this.color,
		);

		// rect left
		r.drawRect(
			this.x - this.crosshair_length + this.crosshair_gap / 2,
			this.y - this.crosshair_length + this.crosshair_gap,
			this.crosshair_thickness,
			this.crosshair_length + this.crosshair_gap,
			this.color,
		);
		// rect right
		r.drawRect(
			this.x + this.crosshair_gap * 2,
			this.y - this.crosshair_length + this.crosshair_gap,
			this.crosshair_thickness,
			this.crosshair_length + this.crosshair_gap,
			this.color,
		);

		// weapon symbols
		if (this.mode === 0) {
			r.drawRect(2, 2, 60, 15, config.theme.colors.black);
			r.advancedText('BULLETS', 5, 10, config.theme.colors.yellow, {
				textBaseline: 'middle',
				textAlign: 'left',
			});
		}
		// weapon symbols
		if (this.mode === 1) {
			r.drawRect(2, 2, 60, 15, config.theme.colors.dark_red);
			r.advancedText('ROCKETS', 5, 10, config.theme.colors.yellow, {
				textBaseline: 'middle',
				textAlign: 'left',
			});
		}

	}

	speed: number = 400;
	update(delta: number) {
		this.handleMovement(delta);
		this.handleFire(delta);
	}

	firerate = 650; // bullets/min
	timer = 0;
	// toggle system
	handleFire(delta: number) {
		if (this.firing) {
			if (this.timer >= 60 / this.firerate) {
				this.fire();
				this.timer = 0;
			}
		}
		this.timer += delta;
	}

	fire() {
		if (this.mode === 0) {
			this.firerate = 650;
			// fire bullets
			this.inflictsDamage.push(new Bullet(this.x, this.y, this.inflictsDamage, 0, 0));
			this.inflictsDamage.push(new Bullet(this.x + 10, this.y, this.inflictsDamage, 3, 5));
			this.inflictsDamage.push(new Bullet(this.x - 10, this.y, this.inflictsDamage, -3, 5));
			this.inflictsDamage.push(new Bullet(this.x - 10, this.y, this.inflictsDamage, 5, 5));
			this.inflictsDamage.push(new Bullet(this.x - 10, this.y, this.inflictsDamage, 5, 5));
		}
		if (this.mode === 1) {
			this.firerate = 100;
			this.inflictsDamage.push(new Rocket(this.x, this.y, this.inflictsDamage, 0, 0));
		}
	}

	handleMovement(delta: number) {
		let dx = 0; // movement on x axis
		let dy = 0; // movement on y axis

		if (this.input.isDown('ArrowUp')) {
			dy -= 1;
		}
		if (this.input.isDown('ArrowDown')) {
			dy += 1;
		}
		if (this.input.isDown('ArrowLeft')) {
			dx -= 1;
		}
		if (this.input.isDown('ArrowRight')) {
			dx += 1;
		}

		// i hate pythagoras
		if (dx !== 0 && dy !== 0) {
			const inv = 1 / Math.sqrt(2);
			dx *= inv;
			dy *= inv;
		}

		const k = dy / dx; // angle
		// console.log(k);

		// overshot x
		if (this.x >= config.canvas_width && dx > 0) {
			// check at which angle we hit the wall
			dx = 0;
			dy = k;
		}
		// undershot x
		if (this.x <= 0 && dx < 0) {
			dx = 0;
			dy = -k;
		}

		// overshot  y
		if (this.y >= config.canvas_height && dy > 0) {
			dy = 0;
		}
		// undershot y
		if (this.y <= 0 && dy < 0) {
			dy = 0;
		}

		if (this.input.isDown('Shift')) {
			this.x += dx * (this.speed / 4) * delta;
			this.y += dy * (this.speed / 4) * delta;
		}
		if (!this.input.isDown('Shift')) {
			this.x += dx * this.speed * delta;
			this.y += dy * this.speed * delta;
		}

		const minX = 0;
		const maxX = config.canvas_width - 2;
		const minY = 0;
		const maxY = config.canvas_height - 2;

		this.x = Math.min(Math.max(this.x, minX), maxX);
		this.y = Math.min(Math.max(this.y, minY), maxY);
	}
}

class ControlInfo extends Entity implements Vulnerable {
	rect_color = config.theme.colors.gray;
	text_color = config.theme.colors.dark_gray;
	change: boolean = false;

	HP: number = 1000;

	constructor(private vulnerables: (Entity & Vulnerable)[]) {
		super(config.canvas_width / 2 - 55, config.canvas_height / 2 - 25, 110, 50);
	}

	takeDamage(damage: number): void {
		if (this.HP < 0) {
			for (let i = 0; i < this.vulnerables.length; ++i) {
				if (this.vulnerables[i] === this) {
					this.vulnerables.splice(i, 1);
					return;
				}
			}
		}
		this.rect_color = config.theme.colors.red;
		setInterval(() => {
			this.rect_color = config.theme.colors.gray;
		}, 100);

		this.HP -= damage;
	}

	render(r: Renderer) {
		r.drawRect(this.x, this.y, this.w, this.h, this.rect_color);

		r.advancedText('CONTROLS:', this.x + this.w / 5, this.y + 10, this.text_color, {
			textBaseline: 'middle',
			textAlign: 'left',
		});
		r.advancedText('ARROW = MOVE', this.x + 2, this.y + 20, this.text_color, {
			textBaseline: 'middle',
			textAlign: 'left',
		});
		r.advancedText('SHIFT = SLOW', this.x + 2, this.y + 30, this.text_color, {
			textBaseline: 'middle',
			textAlign: 'left',
		});
		r.advancedText('SPACE = FIRE', this.x + 2, this.y + 40, this.text_color, {
			textBaseline: 'middle',
			textAlign: 'left',
		});

	}

	elapsed = 0;
	counter = 0;
	update(delta: number) {
		if (this.counter <= 50) {
			if (this.elapsed >= 0.1) {
				if (this.change) {
					this.text_color = config.theme.colors.gray;
				} else {
					this.text_color = config.theme.colors.dark_gray;
				}
				this.change = !this.change;
				this.elapsed = 0;
				this.counter += 1;
			}
			this.elapsed += delta;
		}
	}
}

class Mothership extends Entity {
	muzzle_color = config.theme.colors.black;

	constructor() {
		super(config.canvas_width / 2 - 10, 155, 20, 20);
	}

	render(r: Renderer) {
		r.drawRect(this.x, this.y, this.w, this.h, config.theme.colors.gray);
		r.drawRect(
			this.x + this.w * 0.25,
			this.y,
			this.w * 0.5,
			this.h * 0.5,
			this.muzzle_color,
		);
	}
}

class FarStar extends Entity {
	private size: number;
	private speed: number;
	private color = config.theme.colors.white;

	static readonly min_size: number = 1;
	static readonly max_size: number = 3;

	static readonly min_speed: number = 50;
	static readonly max_speed: number = 200;

	constructor() {
		super(Math.floor(Math.random() * config.canvas_width), -30, 0, 0);
		this.size = Math.floor(Math.random() * FarStar.max_size) + FarStar.min_size;
		this.speed = Math.floor(Math.random() * FarStar.max_speed) + FarStar.min_speed;
	}

	update(delta: number) {
		if (this.y >= config.canvas_height + 10) {
			this.y = -30;
			this.x = Math.floor(Math.random() * config.canvas_width);
			this.size = Math.floor(Math.random() * FarStar.max_size) + FarStar.min_size;
			this.speed = Math.floor(Math.random() * FarStar.max_speed) + FarStar.min_speed;

			// Meteorites
			if ((Math.floor(Math.random() * 20) + 1) === 5) {
				this.size = Math.floor(Math.random() * 5) + 1;
				this.speed = 500;
				this.color = config.theme.colors.yellow;
			} else {
				this.color = config.theme.colors.white;
			}
		}

		this.y += delta * this.speed;
	}

	render(r: Renderer) {
		r.drawRect(this.x, this.y, this.size, this.size, this.color);
	}
}

type GameState = 'start' | 'running' | 'pause' | 'end';
class GameScene extends Scene {
	entities: Entity[] = [];
	stars: Entity[] = [];

	// weapons
	inflictsDamage: (Entity & InflictsDamage)[] = [];

	// targets
	vulnerables: (Entity & Vulnerable)[] = [];

	input: Input = new Input();
	private gamestate: GameState = 'running';

	crosshair: Crosshair = new Crosshair(this.inflictsDamage, this);
	timer: Timer = new Timer();
	mothership: Mothership = new Mothership();
	controlinfo: ControlInfo = new ControlInfo(this.vulnerables);

	constructor() {
		super();

		this.entities.push(this.timer);
		this.entities.push(this.crosshair);
		this.entities.push(this.mothership);
		this.vulnerables.push(this.controlinfo);

		const n = 30; // amount of stars (default 15)
		for (let i = 0; i < n; i++) {
			this.stars.push(new FarStar());
		}

		this.handleInput();
	}

	update(dt: number) {
		if (this.gamestate === 'running') {
			for (const e of this.entities) {
				e.update(dt);
			}
			for (const e of this.stars) {
				e.update(dt);
			}
			for (const e of this.inflictsDamage) {
				e.update(dt);
			}
			for (const e of this.vulnerables) {
				e.update(dt);
			}
		}

		this.handleCollisions();
	}

	isVulnerable(entity: Entity): entity is Entity & Vulnerable {
		return 'HP' in entity;
	}
	handleCollisions() {
		for (let i = 0; i < this.vulnerables.length; i++) {
			for (let j = 0; j < this.inflictsDamage.length; j++) {
				if (this.inflictsDamage[j].collidesWith(this.vulnerables[i])) {
					this.inflictsDamage[j].color = config.theme.colors.white;
					this.inflictsDamage[j].w *= this.inflictsDamage[j].explosion_size_multiplier;
					this.inflictsDamage[j].h *= this.inflictsDamage[j].explosion_size_multiplier;

					this.vulnerables[i].takeDamage(this.inflictsDamage[j].damage);
					setTimeout(() => {
						this.inflictsDamage.splice(j, 1);
					});
					return;
				}
			}
		}
	}

	render(r: Renderer) {
		super.render(r);
		for (const e of this.stars) {
			e.render(r);
		}
		for (const e of this.entities) {
			e.render(r);
		}
		for (const e of this.inflictsDamage) {
			e.render(r);
		}
		for (const e of this.vulnerables) {
			e.render(r);
		}
	}

	handleInput() {}
}

// GAME
export class CheatAndFlee extends Game {
	gameIsRunning = true;

	constructor() {
		super();

		this.scene = new MenuScene(() => {
			if (this.gameIsRunning) {
				this.scene = new GameScene();
				this.gameIsRunning = false;
			}
		});
	}

	loadAssets(loader: AssetLoader) {
		super.loadAssets(loader);
	}
}