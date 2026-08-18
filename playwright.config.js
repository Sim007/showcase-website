import { defineConfig, devices } from '@playwright/test';

// Eén werker, en met opzet niet parallel. De stub deelt één rotatie van drie
// opnames over alle verbindingen: elke `POST /v1/runs` schuift hem op. Draaien
// er twee specs tegelijk, dan schuift de een de rotatie onder de ander weg, en
// dan meet je niet-reproduceerbare uitkomsten. Serieel draaien is hier dus geen
// snelheidsafweging maar een voorwaarde om íets te kunnen beweren.
//
// De suite start de stub zelf. Draait er al een op 8090, dan wordt die
// hergebruikt (lokaal handig); in CI altijd een verse, zodat de rotatie op een
// bekend punt begint.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: [
    {
      command: 'npm run stub',
      url: 'http://localhost:8090/v1/scenarios',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command: 'npm run dev',
      cwd: './server',
      url: 'http://localhost:4000/api/content/showcases',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev',
      cwd: './client',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
