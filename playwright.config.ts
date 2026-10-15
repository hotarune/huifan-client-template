import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  use: { baseURL: "http://localhost:6184" },
  webServer: {
    command: "pnpm build && pnpm preview",
    port: 6184,
    reuseExistingServer: false,
  },
});
