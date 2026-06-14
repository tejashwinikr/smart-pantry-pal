// app.config.ts
import { defineConfig } from "@tanstack/start/config";
import viteTsConfigPaths from "vite-tsconfig-paths";
var app_config_default = defineConfig({
  tsr: {
    appDirectory: "src"
  },
  vite: {
    plugins: [viteTsConfigPaths()]
  },
  server: {
    preset: "vercel"
  }
});
export {
  app_config_default as default
};
