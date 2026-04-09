import { Entity } from '../../engine/entity/entity.ts';
import { config } from '../../engine/config.ts';
import { type Renderer } from '../../engine/core/renderer.ts';
import { Scene } from '../../engine/scenes/scene.ts';
import type { Input } from '../../engine/core/input.ts';
import { Game } from '../../engine/core/game.ts';
import { MenuScene } from '../../engine/scenes/menuScene.ts';
import { signal } from '../../engine/utils/signal.ts';
import { ScoreDisplay } from '../../engine/entity/scoreDisplay.ts';
import { HeartDisplay } from '../../engine/entity/heartDisplay.ts';
import type { AssetLoader } from '../../engine/assets/assetloader.ts';
import { type Asset, ImageAsset, SoundAsset } from '../../engine/assets/asset.ts';
import table from '../../../public/assets/images/table.png';
import table_dance from '../../../public/assets/sounds/songs/table_dance.wav';

type TableStatus = 'home' | 'moving' | 'locked';

class Table extends Entity {
	public status: TableStatus = 'home';
	public target: { x: number; y: number; w: number; h: number } | null = null;

	constructor(
		public id: number,
		private home: HomeSlot,
	) {
		super(home.x, home.y, home.w, home.h);
	}

	render(r: Renderer) {
		const color =
			this.status === 'locked' ? config.theme.colors.green : config.theme.colors.blue;

		r.drawImage(tableAsset.img, this.x, this.y, this.w, this.h);
		r.advancedText(
			this.id.toString(),
			this.x + this.w / 2,
			this.y + this.h / 2 - 2,
			config.theme.colors.white,
			{ textAlign: 'center', textBaseline: 'middle' },
		);
	}

	reset() {
		this.x = this.home.x;
		this.y = this.home.y;
		this.status = 'home';
	}
}

class HomeSlot extends Entity {
	public tableId: number;

	constructor(id: number, index: number) {
		const spacing = config.canvas_width / 5;
		const x = index * spacing + spacing / 2 - 20;
		const y = 20;
		super(x, y, 40, 20);
		this.tableId = id;
	}
	render(r: Renderer) {
		const pad = 1;

		r.drawRect(
			this.x - pad,
			this.y - pad,
			this.w + pad * 2,
			this.h + pad * 2,
			'rgba(255,255,255,0.2)',
		);
		r.advancedText(
			this.tableId.toString(),
			this.x + this.w / 2,
			this.y + this.y / 2,
			config.theme.colors.black,
			{ textAlign: 'center', textBaseline: 'middle' },
		);
	}
}

class Target extends Entity {
	public isFilled: boolean = false;

	constructor(
		public id: number,
		x: number,
		y: number,
		w: number,
		h: number,
	) {
		super(x, y, w, h);
	}
	checkSnap(table: Table): boolean {
		if (table.id !== this.id || this.isFilled) {
			return false;
		}

		if (table.collidesWith(this)) {
			table.x = this.x;
			table.y = this.y;
			this.isFilled = true;
			table.status = 'locked';
			return true;
		}
		return false;
	}
	render(r: Renderer) {
		const color = this.isFilled ? config.theme.colors.green : 'rgba(255,255,255,0.2)';
		const pad = this.isFilled ? 2 : 0;

		r.drawRect(this.x - pad, this.y - pad, this.w + pad * 2, this.h + pad * 2, color);

		if (!this.isFilled) {
			r.advancedText(this.id.toString(), this.x, this.y, config.theme.colors.white, {
				textAlign: 'center',
				textBaseline: 'middle',
			});
		}
	}
}
type GameState = 'start' | 'running' | 'end';

class GameScene extends Scene {
	private state: GameState = 'running';

	private slots: HomeSlot[] = [];
	private tables: Table[] = [];
	private targets: Target[] = [];

	private activeTableIndex: number = 0;
	private transitionTimer: number = 0;

	private levelTime: number = 15.0;
	private currentTime: number = 15.0;

	private score = signal(0);
	private scoreDisplay = new ScoreDisplay(this.score);

	constructor(private input: Input) {
		super();
		tableDanceAsset.play();

		for (let i = 1; i <= 5; i++) {
			const slot = new HomeSlot(i, i - 1);
			this.slots.push(slot);
			this.tables.push(new Table(i, slot));
		}
		input.onKeyDown((key) => {
			if (this.state !== 'running') {return;}

			const val = parseInt(key);
			if (val >= 1 && val <= 5) {
				this.activeTableIndex = val - 1;
			}
		});
		this.startNewRound();
	}
	private startNewRound() {
		this.targets = [];
		this.activeTableIndex = -1;
		this.state = 'running';
		this.currentTime = this.levelTime;
		this.tables.forEach((table) => {
			table.reset();

			let target: Target;
			let rx: number;
			let ry: number;
			let attempts = 0;

			do {
				const rx = Math.random() * (config.canvas_width - table.w);
				const ry = 40 + Math.random() * (config.canvas_height - table.h - 40);

				target = new Target(table.id, rx, ry, table.w, table.h);

				attempts++;

				if (attempts > 100) {break;}
			} while (this.targets.some((t) => target.collidesWith(t)));

			this.targets.push(target);
		});
	}
	update(dt: number, input: Input) {
		if (this.state === 'end') {return;}

		this.currentTime -= dt;
		if (this.currentTime <= 0) {
			tableDanceAsset.stop();
			this.state = 'end';
			return;
		}
		if (this.activeTableIndex !== -1) {
			const t = this.tables[this.activeTableIndex];
			const target = this.targets[this.activeTableIndex];

			if (t.status !== 'locked') {
				const speed = 400 * dt;

				if (input.isDown(config.keys.up)) {
					if (t.y - speed >= 20 + t.h) {
						t.y -= speed;
					}
				}

				if (input.isDown(config.keys.down)) {
					if (t.y + t.h + speed <= config.canvas_height) {
						t.y += speed;
					}
				}

				if (input.isDown(config.keys.left)) {
					if (t.x - speed >= 0) {
						t.x -= speed;
					}
				}

				if (input.isDown(config.keys.right)) {
					if (t.x + t.w + speed <= config.canvas_width) {
						t.x += speed;
					}
				}

				if (
					input.isDown(config.keys.left) ||
					input.isDown(config.keys.down) ||
					input.isDown(config.keys.left) ||
					input.isDown(config.keys.right)
				) {
					t.status = 'moving';
				}

				if (target.checkSnap(t)) {
					this.activeTableIndex = -1;
					this.score.update((v) => v + 100);
					if (this.tables.every((table) => table.status === 'locked')) {
						this.levelTime = Math.max(3, this.levelTime * 0.9);
						this.startNewRound();
					}
				}
			}
		}
	}
	render(r: Renderer) {
		this.slots.forEach((slot) => slot.render(r));

		this.targets.forEach((target) => target.render(r));

		this.tables.forEach((table, index) => {
			if (index === this.activeTableIndex) {
				r.drawRect(
					table.x - 2,
					table.y - 2,
					table.w + 4,
					table.h + 4,
					config.theme.colors.white,
				);
			}
			table.render(r);
		});

		const timeText = `TIME: ${Math.max(0, this.currentTime).toFixed(1)}s`;
		const timeColor =
			this.currentTime < 5 ? config.theme.colors.red : config.theme.colors.white;
		this.scoreDisplay.render(r);

		r.advancedText(timeText, 150, 7, timeColor, {
			textAlign: 'left',
			textBaseline: 'top',
		});

		if (this.state === 'end') {
			r.drawRect(0, 0, config.canvas_width, config.canvas_height, 'rgba(0, 0, 0, 0.85)');

			r.advancedText(
				'GAME OVER',
				config.canvas_width / 2,
				config.canvas_height / 2 - 20,
				config.theme.colors.red,
				{ textAlign: 'center', textBaseline: 'middle' },
			);
		}
	}
}

const tableAsset = new ImageAsset(table);
const tableDanceAsset = new SoundAsset(table_dance);

export class TestTheTables extends Game {
	constructor() {
		super();
		this.scene = new MenuScene(() => {
			this.scene = new GameScene(this.input);
		});
	}
	reset() {
		this.scene = new GameScene(this.input);
	}

	loadAssets(loader: AssetLoader) {
		super.loadAssets(loader);

		loader.add(tableAsset);
		loader.add(tableDanceAsset);
	}
}
