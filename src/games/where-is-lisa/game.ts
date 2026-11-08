import { Game } from '@engine/core/game.ts';
import { MenuScene } from '@engine/scenes/menuScene.ts';
import { Scene } from '@engine/scenes/scene.ts';
import  { type Input } from '@engine/core/input.ts';
import { config } from '@engine/config.ts';
import { Entity } from '@engine/entity/entity.ts';
import  { type Renderer } from '@engine/core/renderer.ts';
import { SoundAsset } from '@engine/assets/asset.ts';
import type { AssetLoader } from '@engine/assets/assetloader.ts';

import song from '@assets/sounds/songs/the_search.wav';
import game_over from "@assets/sounds/sound_effects/game_over.wav"
import win from "@assets/sounds/sound_effects/win.wav"

type GameState = 'running' | 'won' | 'game over';
const songAsset = new SoundAsset(song);
const gameOverAsset = new SoundAsset(game_over);
const winAsset = new SoundAsset(win);

const randInt = (min: number, max: number): number =>
	Math.floor(Math.random() * (max - min + 1)) + min;
const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);
const PLAYER_SPEED: number = 250;
const WIDTH:number = 240;
const HEIGHT:number = 180;

class Student extends Entity {
  static SPEED = 100;
	constructor() {
		super(0, 0, 10, 10);
    this.resetPosition();
	}
	update(delta: number) {
		super.update(delta);
    if(this.x > WIDTH || this.y > HEIGHT) {
      this.resetPosition();
    }
    this.x += Student.SPEED * delta;
    this.y += Student.SPEED * delta;
	}
	render(r: Renderer) {
		r.drawRect(this.x, this.y, this.w, this.h, config.theme.colors.gray);
	}

  public resetPosition() {
    this.x = randInt(-WIDTH - 10, 0);
    this.y = randInt(-HEIGHT - 10, 0);
  }
}

class Lisa extends Student {
	render(r: Renderer) {
    r.drawRect(this.x, this.y, this.w, this.h, config.theme.colors.white);
  }
}


class Player extends Entity {
	constructor() {
		super(100, 170, 5, 5);
	}
	update(delta: number) {
		super.update(delta);
    this.x = clamp(this.x, 0, WIDTH-this.w);
    this.y = clamp(this.y, 0, HEIGHT-this.h);
	}
	render(r: Renderer) {
		r.drawRect(
			this.x,
			this.y,
			this.w,
			this.h,
			config.theme.colors.purple,
		);
	}
}


class GameScene extends Scene {
  time:number = 0;
  state:GameState = "running";
	player: Player = new Player();
  stones:Student[] = new Array<Student>();
  lisa:Lisa = new Lisa();
	constructor() {
		super();
		songAsset.play();
    this.state = "running";
    for (let j = 0; j < 15; j++) {
      this.stones.push(new Student());
    }
	}

	update(delta: number, input: Input) {
		switch (this.state) {
			case 'game over':
				gameOverAsset.play();
				return;
			case 'won':
				winAsset.play();
				return;
			case 'running':
				break;
		}
		if(!songAsset.isPlaying()){
			songAsset.play();
		}
    this.time += delta;
    this.lisa.update(delta);
		super.update(delta, input);
		this.player.update(delta);
    for(const stone of this.stones){
      stone.update(delta);
      if(stone.collidesWith(this.player)){
        this.state = "game over";
      }
    }
    if(this.lisa.collidesWith(this.player)){
      this.state = "won";
    }
    if(input.isDown(config.keys.right)) {
      this.player.x += delta * PLAYER_SPEED;
    }
    if(input.isDown(config.keys.left)) {
      this.player.x -= delta * PLAYER_SPEED;
    }
    if(input.isDown(config.keys.up)) {
      this.player.y -= delta * PLAYER_SPEED;
    }
    if(input.isDown(config.keys.down)) {
      this.player.y += delta * PLAYER_SPEED;
    }
	}

	render(renderer: Renderer) {
		super.render(renderer);
    this.lisa.render(renderer);
    for (const stone of this.stones) {
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
  if (this.state === 'won') {
		renderer.advancedText(
			'You found Lisa!',
			config.canvas_width / 2,
			config.canvas_height / 2,
			config.theme.colors.white,
			{ textAlign: 'center', textBaseline: 'middle' },
		);
		songAsset.pause();
	}
    let timeText = "Time: " + this.time.toFixed(0);
    renderer.advancedText(timeText, 180, 7, config.theme.colors.white, {
		textAlign: 'left',
		textBaseline: 'top',
	});

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
	}
	loadAssets(loader: AssetLoader) {
		super.loadAssets(loader);

		loader.add(songAsset);
		loader.add(gameOverAsset);
		loader.add(winAsset);
	}
}
