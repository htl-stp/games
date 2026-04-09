import type { Renderer } from '../core/renderer.ts';
import type { Input } from '../core/input.ts';
import type { AssetLoader } from '../assets/assetloader.ts';

export abstract class Scene {
	render(renderer: Renderer) {}
	update(delta: number, input: Input) {}
	loadAssets(loader: AssetLoader) {}
}
