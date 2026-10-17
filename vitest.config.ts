import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Database tests share one database, so run test files one after another
    fileParallelism: false,
    // These values override your .env, so tests ALWAYS use the test database
    env: {
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/mohima_test",
      BETTER_AUTH_SECRET: "test-secret-test-secret-test-secret-12",
      BETTER_AUTH_URL: "http://localhost:3000",
    },
  },
});
