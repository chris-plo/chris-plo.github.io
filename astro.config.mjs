import { defineConfig } from "astro/config";
import remarkInteractiveDemos from "./src/lib/remark-interactive-demos.mjs";

export default defineConfig({
  site: "https://chrisplo.dev",
  output: "static",
  trailingSlash: "always",
  markdown: {
    remarkPlugins: [remarkInteractiveDemos]
  }
});
