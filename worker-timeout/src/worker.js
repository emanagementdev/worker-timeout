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
		const ORIGIN_URL = "https://lps.systems"; // Retirer le /* qui causait une URL invalide
		const WORKER_TIMEOUT = 600000;
		const ORIGIN_TIMEOUT = 300000;

		const controller = new AbortController();
		const timeoutId = setTimeout(() => {
			controller.abort();
			console.log("Timeout dépassé!!! 10 minutes max.");
		}, WORKER_TIMEOUT);

		try {
			// 2. Bufferiser le corps de la requête
			const bodyBuffer = await request.clone().arrayBuffer();

			// 3. Construire la nouvelle requête
			const newRequest = new Request(ORIGIN_URL + new URL(request.url).pathname, {
				signal: controller.signal,
				method: request.method,
				headers: request.headers,
				body: bodyBuffer, // Utiliser le corps bufferisé
				redirect: "manual", // Désactiver le suivi automatique des redirects
				cf: {
					timeout: ORIGIN_TIMEOUT,
					cacheEverything: false
				}
			});

			let response = await fetch(newRequest);

			// 4. Gérer manuellement les redirections
			if ([301, 302, 307, 308].includes(response.status)) {
				const location = response.headers.get("Location");
				response = await fetch(location, newRequest); // Réutiliser la requête bufferisée
			}

			// 5. Headers de sécurité améliorés
			const headers = new Headers(response.headers);
			headers.set("X-Content-Type-Options", "nosniff");
			headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
			headers.set("Access-Control-Allow-Origin", "*");

			return new Response(response.body, {
				status: response.status,
				headers
			});

		} catch (err) {
			// 6. Gestion d'erreur améliorée
			const status = err.name === 'AbortError' ? 504 : 502;
			return new Response(JSON.stringify({
				error: err.message,
				code: status,
				success: false
			}), {
				status,
				headers: {
					"Content-Type": "application/json",
					"Cache-Control": "no-store"
				}
			});

		} finally {
			clearTimeout(timeoutId);
		}
	}
}
