// SPA mode - no server-side config
// Use Vite env variables (VITE_ prefix) instead
export function getServerConfig() {
  return {
    nodeEnv: typeof import.meta !== 'undefined' 
      ? (import.meta.env.MODE as string) || "development"
      : "development",
  };
}