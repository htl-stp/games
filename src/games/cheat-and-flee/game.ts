import { Game } from '@engine/core/game.ts';
import { MenuScene } from '@engine/scenes/menuScene.ts';
import type { AssetLoader } from '@engine/assets/assetloader.ts';
import { Scene } from '@engine/scenes/scene.ts';
import { Entity } from '@engine/entity/entity.ts';
import { type Renderer } from '@engine/core/renderer.ts';
import { Input } from '@engine/core/input.ts';
import { config } from '@engine/config.ts';
import type { Vulnerable } from '@games/cheat-and-flee/vulnerable.ts';
import { SpaceViper } from '@games/cheat-and-flee/spaceviper.ts';
import { Bullet } from '@games/cheat-and-flee/weapons/bullets.ts';
import { Rocket } from '@games/cheat-and-flee/weapons/rockets.ts';
import { Nuke } from '@games/cheat-and-flee/weapons/nuke.ts';
import type { Projectile } from '@games/cheat-and-flee/projectile.ts';
import { Marauder } from '@games/cheat-and-flee/marauder.ts';
import { Emp } from '@games/cheat-and-flee/weapons/emp.ts';

class Stages extends Entity {
	stage: number = 0;
	showStage: boolean = false;
	color = config.theme.colors.red;

	constructor() {
		super(config.canvas_width / 2, config.canvas_height / 2, 0, 0);
	}

	increaseStage() {
		this.stage += 1;
		this.showStage = true;

		setTimeout(() => {
			this.showStage = false;
		}, 4500);
	}

	render(r: Renderer) {
		if (this.showStage) {
			r.advancedText('STAGE ' + this.stage, this.x, this.y, this.color, {
				textAlign: 'center',
				textBaseline: 'middle',
			});
		}
	}
}

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

			this.ms += Math.round(delta * 1000);
		}
		if (this.counterRun) {
			if (this.min <= 0 && this.sec <= 0 && this.ms <= 0) {
				this.min = 0;
				this.sec = 0;
				this.ms = 0;
				this.counterRun = false;
				this.color = config.theme.colors.dark_gray;
				this.counterHitZero = true;
				return;
			}
			this.color = config.theme.colors.white;

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

			this.ms -= Math.round(delta * 1000);
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
	counterHitZero: boolean = false;

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

export class Crosshair extends Entity {
	color = config.theme.colors.green;
	input: Input = new Input();

	// 0 = bullets, 1 = rockets, ...
	mode: number = 0;

	autofire: boolean = false;
	constructor(private gamescene: GameScene) {
		super(config.canvas_width / 2, config.canvas_height / 2, 0, 0);

		this.input.onKeyDown((key) => {
			// TOGGLE FIRE, semi - auto
			if (key === 't' || key === 'T') {
				this.autofire = !this.autofire;
				this.gamescene.mothership.muzzle_color = config.theme.colors.red;
				this.fire_mode = 'A';
			}
			if (!this.autofire) {
				this.gamescene.mothership.muzzle_color = config.theme.colors.black;
				this.fire_mode = 'M';
			}
		});
	}

	// all 3 are in proportion to each other
	// e.g. if one is multiplied by 10 then the other 2 are multiplied by 10 as well
	crosshair_gap = 4; // default 4
	crosshair_thickness = 2; // default 2
	crosshair_length = 10; // default 10

	weapon_load_1 = 60;
	weapon_load_2 = 60;
	weapon_load_3 = 60;
	weapon_load_4 = 60;
	fire_mode = 'M';
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
			r.drawRect(2, 2, this.weapon_load_1, 15, config.theme.colors.dark_gray);
			r.advancedText('BULLETS', 5, 10, config.theme.colors.yellow, {
				textBaseline: 'middle',
				textAlign: 'left',
			});
		}
		// weapon symbols
		if (this.mode === 1) {
			r.drawRect(2, 2, this.weapon_load_2, 15, config.theme.colors.dark_red);
			r.advancedText('ROCKETS', 5, 10, config.theme.colors.yellow, {
				textBaseline: 'middle',
				textAlign: 'left',
			});
		}
		if (this.mode === 2) {
			r.drawRect(2, 2, this.weapon_load_3, 15, config.theme.colors.green);
			r.advancedText('N U K E', 5, 10, config.theme.colors.black, {
				textBaseline: 'middle',
				textAlign: 'left',
			});
		}
		if (this.mode === 3) {
			r.drawRect(2, 2, this.weapon_load_4, 15, config.theme.colors.blue);
			r.advancedText('E  M  P', 5, 10, config.theme.colors.dark_yellow, {
				textBaseline: 'middle',
				textAlign: 'left',
			});
		}
		r.drawRect(2, 16, this.weapon_load_1, 2, config.theme.colors.gray);
		r.drawRect(2, 18, this.weapon_load_2, 2, config.theme.colors.red);
		r.drawRect(2, 20, this.weapon_load_3, 2, config.theme.colors.green);
		r.drawRect(2, 22, this.weapon_load_4, 2, config.theme.colors.blue);

		r.advancedText(
			this.fire_mode,
			config.canvas_width / 2 - 4,
			170,
			config.theme.colors.white,
			{
				textBaseline: 'middle',
				textAlign: 'left',
			},
		);
	}

	speed: number = 400;
	update(delta: number) {
		if (this.input.isDown('1') || this.input.isDown('!')) {
			this.mode = 0;
			this.firerate = 650;
		}
		if (this.input.isDown('2') || this.input.isDown('"')) {
			this.mode = 1;
			this.firerate = 100;
		}
		if (this.input.isDown('3') || this.input.isDown('§')) {
			this.mode = 2;
			this.firerate = 10;
		}
		if (this.input.isDown('4') || this.input.isDown('$')) {
			this.mode = 3;
			this.firerate = 5;
		}

		if (this.weapon_load_1 < 60) {
			this.weapon_load_1 += delta * 650;
		} else {
			this.weapon_load_1 = 60;
		}
		if (this.weapon_load_2 < 60) {
			this.weapon_load_2 += delta * 50;
		} else {
			this.weapon_load_2 = 60;
		}
		if (this.weapon_load_3 < 60) {
			this.weapon_load_3 += delta * 10;
		} else {
			this.weapon_load_3 = 60;
		}
		if (this.weapon_load_4 < 60) {
			this.weapon_load_4 += delta * 5;
		} else {
			this.weapon_load_4 = 60;
		}

		this.handleMovement(delta);
		this.handleFire();
		this.handleManualFire();

		this.timer1 += delta * 650;
		this.timer2 += delta * 50;
		this.timer3 += delta * 10;
		this.timer4 += delta * 5;
	}

	firerate = 650; // bullets/min

	timer1 = 100;
	timer2 = 100;
	timer3 = 100;
	timer4 = 100;

	// toggle system
	handleFire() {
		if (this.autofire) {
			this.fire();
		}
	}

	handleManualFire() {
		// MANUAL FIRE
		if (this.input.isDown(' ')) {
			this.autofire = false;
			this.fire();
			this.gamescene.mothership.muzzle_color = config.theme.colors.red;
			setTimeout(() => {
				this.gamescene.mothership.muzzle_color = config.theme.colors.black;
			}, 20);
		}
	}

	damage_multiplier: number = 1;
	fire() {
		if (this.mode === 0 && this.timer1 >= 60) {
			this.weapon_load_1 = 0;
			this.timer1 = 0;
			this.gamescene.weapons.push(
				new Bullet(
					this.x,
					this.y,
					this.gamescene,
					5,
					0,
					NaN,
					NaN,
					NaN,
					NaN,
					10 + this.damage_multiplier,
				),
			);
			this.gamescene.weapons.push(
				new Bullet(
					this.x,
					this.y,
					this.gamescene,
					-5,
					0,
					NaN,
					NaN,
					NaN,
					NaN,
					10 + this.damage_multiplier,
				),
			);
			this.gamescene.weapons.push(
				new Bullet(
					this.x,
					this.y,
					this.gamescene,
					5,
					2,
					NaN,
					NaN,
					NaN,
					NaN,
					10 + this.damage_multiplier,
				),
			);
			this.gamescene.weapons.push(
				new Bullet(
					this.x,
					this.y,
					this.gamescene,
					-5,
					2,
					NaN,
					NaN,
					NaN,
					NaN,
					10 + this.damage_multiplier,
				),
			);
			this.gamescene.weapons.push(
				new Bullet(
					this.x,
					this.y,
					this.gamescene,
					0,
					2,
					NaN,
					NaN,
					NaN,
					NaN,
					10 + this.damage_multiplier,
				),
			);

			this.gamescene.weapons.push(
				new Bullet(
					this.x,
					this.y,
					this.gamescene,
					5,
					0,
					NaN,
					NaN,
					NaN,
					NaN,
					10 + this.damage_multiplier,
				),
			);
			this.gamescene.weapons.push(
				new Bullet(
					this.x,
					this.y,
					this.gamescene,
					-5,
					0,
					NaN,
					NaN,
					NaN,
					NaN,
					10 + this.damage_multiplier,
				),
			);
			this.gamescene.weapons.push(
				new Bullet(
					this.x,
					this.y,
					this.gamescene,
					5,
					2,
					NaN,
					NaN,
					NaN,
					NaN,
					10 + this.damage_multiplier,
				),
			);
			this.gamescene.weapons.push(
				new Bullet(
					this.x,
					this.y,
					this.gamescene,
					-5,
					2,
					NaN,
					NaN,
					NaN,
					NaN,
					10 + this.damage_multiplier,
				),
			);
			this.gamescene.weapons.push(
				new Bullet(
					this.x,
					this.y,
					this.gamescene,
					0,
					2,
					NaN,
					NaN,
					NaN,
					NaN,
					10 + this.damage_multiplier,
				),
			);
		}
		if (this.mode === 1 && this.timer2 >= 60) {
			this.weapon_load_2 = 0;
			this.timer2 = 0;
			this.gamescene.weapons.push(new Rocket(this.x, this.y, this.gamescene, 0, 0));
		}
		if (this.mode === 2 && this.timer3 >= 60) {
			this.weapon_load_3 = 0;
			this.timer3 = 0;
			this.gamescene.weapons.push(new Nuke(this.x, this.y, this.gamescene, 0, 0));
		}
		if (this.mode === 3 && this.timer4 >= 60) {
			this.weapon_load_4 = 0;
			this.timer4 = 0;
			this.gamescene.weapons.push(new Emp(this.x, this.y, this.gamescene, 0, 0));
		}
	}

	// fields on the class
	vx = 0;
	vy = 0;
	accel = 4; // how fast you reach full speed (higher = snappier)
	decel = 6; // how fast you stop (lower = more slide)

	handleMovement(delta: number) {
		let dx = 0;
		let dy = 0;

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

		// normalize diagonal (also handles dx=dy=0 safely)
		const len = Math.hypot(dx, dy);
		if (len > 0) {
			dx /= len;
			dy /= len;
		}

		const maxSpeed = this.input.isDown('Shift') ? this.speed / 4 : this.speed;

		// target velocity from input
		const targetVx = dx * maxSpeed;
		const targetVy = dy * maxSpeed;

		// accelerate when input is held, decelerate when released
		const rate = len > 0 ? this.accel : this.decel;
		const t = 1 - Math.exp(-rate * delta); // frame-rate independent smoothing

		this.vx += (targetVx - this.vx) * t;
		this.vy += (targetVy - this.vy) * t;

		// snap to zero so you don't drift forever at 0.0001
		if (Math.abs(this.vx) < 0.001) {
			this.vx = 0;
		}
		if (Math.abs(this.vy) < 0.001) {
			this.vy = 0;
		}

		this.x += this.vx * delta;
		this.y += this.vy * delta;

		// clamp to bounds and kill velocity on the axis that hit the wall
		const minX = 0;
		const maxX = config.canvas_width - 2;
		const minY = 0;
		const maxY = config.canvas_height - 2;

		if (this.x < minX) {
			this.x = minX;
			this.vx = 0;
		}
		if (this.x > maxX) {
			this.x = maxX;
			this.vx = 0;
		}
		if (this.y < minY) {
			this.y = minY;
			this.vy = 0;
		}
		if (this.y > maxY) {
			this.y = maxY;
			this.vy = 0;
		}
	}
}

class ControlInfo extends Entity implements Vulnerable {
	rect_color = config.theme.colors.black;
	text_color = config.theme.colors.dark_gray;
	change: boolean = false;

	HP: number = 1000;

	constructor(private gamescene: GameScene) {
		super(config.canvas_width / 2 - 55, config.canvas_height / 2 - 70, 115, 120);
	}

	takeDamage(damage: number): void {
		this.HP -= damage;
		if (this.HP <= 0) {
			let counter = 550; // how many iterations
			for (let i = 0; i < this.gamescene.vulnerables.length; ++i) {
				if (this.gamescene.vulnerables[i] === this) {
					this.gamescene.vulnerables.splice(i, 1);
					this.gamescene.timer.startCountdown(0, 10, 0);
					const slow = setInterval(() => {
						if (counter <= 0) {
							clearInterval(slow);
						}
						FarStar.min_speed -= 0.5;
						FarStar.max_speed -= 1;
						counter -= 1;
					}, 10);
					return;
				}
			}
		}
		this.rect_color = config.theme.colors.red;
		setInterval(() => {
			this.rect_color = config.theme.colors.black;
		}, 100);
	}

	render(r: Renderer) {
		r.drawRect(this.x, this.y, this.w, this.h, this.rect_color);

		r.advancedText('CONTROLS:', this.x + this.w / 5, this.y + 10, this.text_color, {
			textBaseline: 'middle',
			textAlign: 'left',
		});
		r.drawRect(this.x + 5, this.y + 20, 100, 2, this.text_color);

		r.advancedText('ARROW = MOVE', this.x + 2, this.y + 30, this.text_color, {
			textBaseline: 'middle',
			textAlign: 'left',
		});
		r.advancedText('SHIFT = SLOW', this.x + 2, this.y + 40, this.text_color, {
			textBaseline: 'middle',
			textAlign: 'left',
		});
		r.advancedText('SPACE = FIRE', this.x + 2, this.y + 50, this.text_color, {
			textBaseline: 'middle',
			textAlign: 'left',
		});
		r.advancedText('T = AUTO FIRE', this.x + 2, this.y + 60, this.text_color, {
			textBaseline: 'middle',
			textAlign: 'left',
		});
		r.drawRect(this.x + 5, this.y + 70, 100, 2, this.text_color);

		r.advancedText('1 = BULLETS', this.x + 2, this.y + 80, this.text_color, {
			textBaseline: 'middle',
			textAlign: 'left',
		});
		r.advancedText('2 = ROCKETS', this.x + 2, this.y + 90, this.text_color, {
			textBaseline: 'middle',
			textAlign: 'left',
		});
		r.advancedText('3 = NUKE', this.x + 2, this.y + 100, this.text_color, {
			textBaseline: 'middle',
			textAlign: 'left',
		});
		r.advancedText('4 = EMP', this.x + 2, this.y + 110, this.text_color, {
			textBaseline: 'middle',
			textAlign: 'left',
		});
	}

	elapsed = 0;
	counter = 0;
	update(delta: number) {
		if (this.counter <= 15) {
			if (this.elapsed >= 0.1) {
				if (this.change) {
					this.text_color = config.theme.colors.gray;
				} else {
					this.text_color = config.theme.colors.dark_green;
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
		r.drawRect(
			this.x - this.w / 2,
			this.y + this.h / 2,
			this.w * 2,
			this.h * 2,
			config.theme.colors.gray,
		);
		r.drawRect(
			this.x - this.w / 2 + this.w * 0.2,
			this.y + this.h / 2 + this.h * 0.2,
			this.w * 2 * 0.8,
			this.h * 2 * 0.8,
			config.theme.colors.black,
		);
		r.drawRect(this.x, this.y, this.w, this.h, config.theme.colors.gray);
		r.drawRect(this.x + this.w * 0.25, this.y, this.w * 0.5, this.h * 0.5, this.muzzle_color);
	}
}

class FarStar extends Entity {
	private size: number;
	private speed: number;
	private color = config.theme.colors.white;

	static min_size: number = 1;
	static max_size: number = 3;

	// default: 350, 800
	static min_speed: number = 350;
	static max_speed: number = 800;

	constructor() {
		super(Math.floor(Math.random() * config.canvas_width), -30, 0, 0);
		this.size = Math.floor(Math.random() * FarStar.max_size) + FarStar.min_size;
		this.speed = Math.floor(Math.random() * FarStar.max_speed) + FarStar.min_speed;
	}

	update(delta: number) {
		if (this.y >= config.canvas_height + 50) {
			this.y = -50;
			this.x = Math.floor(Math.random() * config.canvas_width);
			this.size = Math.floor(Math.random() * FarStar.max_size) + FarStar.min_size;
			this.speed = Math.floor(Math.random() * FarStar.max_speed) + FarStar.min_speed;

			// Meteorites
			if (Math.floor(Math.random() * 20) + 1 === 5) {
				this.size = Math.floor(Math.random() * 5) + 1;
				this.speed = FarStar.max_speed * 3;
				this.color = config.theme.colors.gray;
			} else if (Math.floor(Math.random() * 100) + 1 === 50) {
				this.size = Math.floor(Math.random() * 8) + 1;
				this.speed = FarStar.min_speed / 2;
				this.color = config.theme.colors.black;
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
export class GameScene extends Scene {
	entities: Entity[] = [];
	stars: Entity[] = [];

	// weapons
	weapons: (Entity & Projectile)[] = [];

	// targets
	vulnerables: (Entity & Vulnerable)[] = [];

	input: Input = new Input();
	private gamestate: GameState = 'running';

	crosshair: Crosshair = new Crosshair(this);
	timer: Timer = new Timer();
	mothership: Mothership = new Mothership();
	controlinfo: ControlInfo = new ControlInfo(this);
	stages: Stages = new Stages();

	constructor() {
		super();

		this.entities.push(this.timer);
		this.entities.push(this.mothership);
		this.entities.push(this.crosshair);
		this.vulnerables.push(this.controlinfo);
		this.entities.push(this.stages);

		const n = 50; // amount of stars (default 15)
		for (let i = 0; i < n; i++) {
			this.stars.push(new FarStar());
		}

		this.handleInput();
	}
	round_start: boolean = true;

	// change this value and the speed of the entire game changes too, default 1
	speed_multiplier = 1;
	cap: number = 1000; // how many vulnerables at once allowed in player area
	update(dt: number) {
		if (this.gamestate === 'running') {
			for (const e of this.entities) {
				e.update(dt * this.speed_multiplier);
			}
			for (const e of this.stars) {
				e.update(dt * this.speed_multiplier);
			}
			for (const e of this.weapons) {
				e.update(dt * this.speed_multiplier);
			}
			for (const e of this.vulnerables) {
				e.update(dt * this.speed_multiplier);
			}

			if (this.timer.counterHitZero) {
				if (this.round_start) {
					this.timer.startCountdown(0, 5, 0);
					this.n_vipers += 1;

					this.rows_of_vipers += 1;
					if (this.stages.stage >= 5) {
						this.n_marauders += 1;
					}
					this.crosshair.damage_multiplier += 0.5;
					this.cap += 50;
					console.log('======== NEW STAGE ========');
					this.stages.increaseStage();
					this.vulnerables.length = 0;
					if (this.spawnIntervalId !== null) {
						clearInterval(this.spawnIntervalId);
						this.spawnIntervalId = null;
					}
					if (this.delay >= 800) {
						this.delay -= 15;
					}
				} else {
					this.timer.startCountdown(0, 30, 0);
					this.handleEnemies();

					this.rows_of_vipers += 0.5;

					for (let i = 0; i < 5; i++) {
						setTimeout(() => {
							FarStar.min_speed += 10;
							FarStar.max_speed += 10;
						});
					}
				}
				this.round_start = !this.round_start;
				this.timer.counterHitZero = false;
			}
			this.handleCollisions();
			console.log(this.vulnerables.length);
		}
		if (this.vulnerables.length >= this.cap) {
			this.vulnerables.length = this.cap;
		}
	}

	n_vipers = 6;
	n_marauders = 3;
	rows_of_vipers = 5;
	delay = 500;
	private spawnIntervalId: ReturnType<typeof setInterval> | null = null;
	handleEnemies() {
		this.spawnIntervalId = setInterval(() => {
			const random_x_area = Math.floor(Math.random() * 200) + 40;
			for (let i = 0; i < this.rows_of_vipers; i++) {
				for (let j = 0; j < this.n_vipers; j++) {
					const offset_x = Math.floor(Math.random() * 40) + 1;
					const offset_y = Math.floor(Math.random() * 40) + 1;
					this.vulnerables.push(new SpaceViper(random_x_area, offset_x, offset_y, this));
				}
			}

			if (this.stages.stage >= 5) {
				for (let x = 0; x < this.n_marauders; x++) {
					const offset_x = Math.floor(Math.random() * 40) + 1;
					const offset_y = Math.floor(Math.random() * 40) + 1;
					this.vulnerables.push(new Marauder(random_x_area, offset_x, offset_y, this));
				}
			}
		}, this.delay);
	}
	handleCollisions(): void {}

	render(r: Renderer) {
		super.render(r);
		for (const e of this.stars) {
			e.render(r);
		}
		for (const e of this.entities) {
			e.render(r);
		}
		for (const e of this.weapons) {
			e.render(r);
		}
		for (const e of this.vulnerables) {
			e.render(r);
		}
		r.advancedText(
			'RADAR:' + '[' + this.vulnerables.length + ']',
			10,
			170,
			config.theme.colors.dark_gray,
			{
				textBaseline: 'middle',
				textAlign: 'left',
			},
		);
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
