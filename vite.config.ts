import { defineConfig } from "@tanstack/start/config";

export default defineConfig({
  server: {
    preset: "vercel", // ✅ This is critical
  },
});
