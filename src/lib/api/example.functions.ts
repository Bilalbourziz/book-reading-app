import { z } from "zod";

import { getServerConfig } from "../config.server";

// Client-side example function
export const getGreeting = async (data: { name: string }) => {
  const config = getServerConfig();
  return {
    greeting: `Hello, ${data.name}!`,
    mode: config.nodeEnv ?? "unknown",
  };
};