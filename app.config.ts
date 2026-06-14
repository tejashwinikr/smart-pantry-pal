import { createApp } from "vinxi";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default createApp({
  routers: [
    {
      name: "public",
      type: "static",
      dir: "./public",
    },
    {
      name: "client",
      type: "spa",
      handler: "./index.html",
      target: "browser",
      plugins: () => [viteTsConfigPaths()],
    },
    {
      name: "server",
      type: "http",
      handler: "./src/server.ts",
      target: "server",
    },
  ],
});
