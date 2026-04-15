// @ts-check
import {defineConfig} from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://htl-stp.github.io',
	base: '/games/',
	vite: {
		resolve: {
			alias: {
				'@assets': '/src/assets',
				'@engine': '/src/engine',
				'@games': '/src/games',
			},
		},
	},
});
