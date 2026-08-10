const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests-e2e',
  fullyParallel: true,
  webServer: {
    command: 'node server.js',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: { PORT: '3000', DB_PATH: ':memory:' },
  },
  use: {
    baseURL: 'http://localhost:3000',
  },
});
