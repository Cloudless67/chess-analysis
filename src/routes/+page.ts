import type { Load } from '@sveltejs/kit';

export const load: Load = async ({ setHeaders }) => {
	setHeaders({
		'Cross-Origin-Embedder-Policy': 'require-corp',
		'Cross-Origin-Opener-Policy': 'same-origin'
	});
};

export const csr = true;
