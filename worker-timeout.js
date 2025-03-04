export default {
  async fetch(request, env) {
    // Timeout augmenté à 10 minutes (600s)
    const timeoutMs = 600000;
    
    // URL de votre serveur d'origine (IP:port)
    const originUrl = "http://108.181.161.199:";
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(originUrl + new URL(request.url).pathname, {
        signal: controller.signal,
        method: request.method,
        headers: request.headers
      });
      
      return new Response(response.body, {
        status: response.status,
        headers: response.headers
      });
      
    } catch (err) {
      return new Response("Timeout dépassé!! 10 minutes max.", { 
        status: 504,
        headers: { "Content-Type": "text/plain" } 
      });
      
    } finally {
      clearTimeout(timeoutId);
    }
  }
};