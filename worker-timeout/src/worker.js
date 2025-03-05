/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

/*export default {
	async fetch(request, env, ctx) {
		return new Response('Hello World!');
	},
};*/

export default {
	async fetch(request, env) {
		// 1. Configuration des Timeouts
		const ORIGIN_URL = "https://lps.systems/*";
		const WORKER_TIMEOUT = 600000; // 10 minutes (max Enterprise)
		const ORIGIN_TIMEOUT = 300000; // 5 minutes

		const controller = new AbortController();

		// 2. Gestion du Timeout
		const timeoutId = setTimeout(() => {
			controller.abort();
			console.log("Timeout dépassé!!! 10 minutes max.");
			alert("Timeout dépassé!!! 10 minutes max.");
		}, WORKER_TIMEOUT);

		try {
			// 3. Appel à l'Origin avec Timeout dédié
			const originResponse = await fetch(ORIGIN_URL, {
				signal: controller.signal,
				method: request.method,
				headers: request.headers,
				body: request.body,
				cf: {
					timeout: ORIGIN_TIMEOUT
				}
			});

			// 4. Headers de Sécurité
			const headers = new Headers(originResponse.headers);
			headers.set("X-Content-Type-Options", "nosniff");
			headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

			return new Response(originResponse.body, {
				status: originResponse.status,
				headers
			});

		} catch (err) {
			// 5. Gestion des Erreurs
			return new Response(err.message, {
				status: err.name === 'AbortError' ? 504 : 502,
				headers: { "Content-Type": "text/plain" }
			});

		} finally {
			clearTimeout(timeoutId);
		}
	}
}
