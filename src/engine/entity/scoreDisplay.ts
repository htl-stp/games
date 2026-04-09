import { Entity } from './entity.ts';
import type { Renderer } from '../core/renderer.ts';
import type { Signal } from '../utils/signal.ts';

export class ScoreDisplay extends Entity {
	static readonly padding: number = 7;

	constructor(public score: Signal<number>) {
		super(ScoreDisplay.padding, ScoreDisplay.padding, 0, 0);
	}

	render(r: Renderer) {
		r.advancedText(`Score: ${this.score()}`, this.x, this.y, '#fff', {
			textBaseline: 'top',
			textAlign: 'left',
		});
	}
}
