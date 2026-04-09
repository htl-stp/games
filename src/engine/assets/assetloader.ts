import type { Asset } from './asset.ts';

export class AssetLoader {
	private assets: Asset[] = [];

	add(asset: Asset): void {
		this.assets.push(asset);
	}

	async loadAll() {
		await Promise.all(this.assets.map((a) => a.load()));
	}
}
