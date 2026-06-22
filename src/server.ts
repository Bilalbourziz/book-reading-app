// SPA mode - minimal valid server entry
export default {
  async fetch(_request: Request): Promise<Response> {
    return new Response("OK", { status: 200 });
  },
};