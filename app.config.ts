import { defineConfig } from "@tanstack/start/config";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  tsr: {
    appDirectory: "app",
  },
  vite: {
    plugins: [viteTsConfigPaths()],
  },
  server: {
    preset: "vercel",
  },
});
