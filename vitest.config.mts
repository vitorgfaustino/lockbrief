import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: {
        configPath: "./wrangler.toml",
      },
      miniflare: {
        bindings: { TEST_MIGRATIONS: await readD1Migrations("./migrations") },
      },
    }),
  ],
  test: {
    include: ["test/**/*.spec.ts"],
    exclude: ["referencia_IGNORAR/**", "node_modules/**", "dist/**"],
    testTimeout: 15000,
    setupFiles: ["./test/setup.ts"],
  },
});
