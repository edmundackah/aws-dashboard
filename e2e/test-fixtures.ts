import { test as base, expect as baseExpect } from "@playwright/test";
import fs from "fs";
import path from "path";

// Load stubbed JSON responses from WireMock __files directory
const mainDataPath = path.resolve(__dirname, "../wiremock/__files/dashboard_data.json");
const summaryDataPath = path.resolve(
  __dirname,
  "../wiremock/__files/summary_data.json",
);

const mainData = JSON.parse(fs.readFileSync(mainDataPath, "utf-8"));
const summaryData = JSON.parse(fs.readFileSync(summaryDataPath, "utf-8"));

// Mock burndown API data (new planned vs actual shape)
const mockBurndownData = {
  data: {
    dev: [
      {
        date: "2024-01-01",
        ts: 1704067200000,
        spaActual: 150,
        msActual: 200,
        spaPlanned: 160,
        msPlanned: 210,
        combinedActual: 350,
        combinedPlanned: 370
      },
      {
        date: "2024-06-01",
        ts: 1717200000000,
        spaActual: 0,
        msActual: 0,
        spaPlanned: 30,
        msPlanned: 60,
        combinedActual: 0,
        combinedPlanned: 90
      }
    ],
    sit: [
      {
        date: "2024-01-01",
        ts: 1704067200000,
        spaActual: 140,
        msActual: 190,
        spaPlanned: 150,
        msPlanned: 200,
        combinedActual: 330,
        combinedPlanned: 350
      },
      {
        date: "2024-06-01",
        ts: 1717200000000,
        spaActual: 0,
        msActual: 0,
        spaPlanned: 20,
        msPlanned: 50,
        combinedActual: 0,
        combinedPlanned: 70
      }
    ],
    uat: [
      {
        date: "2024-01-01",
        ts: 1704067200000,
        spaActual: 130,
        msActual: 180,
        spaPlanned: 140,
        msPlanned: 190,
        combinedActual: 310,
        combinedPlanned: 330
      },
      {
        date: "2024-06-01",
        ts: 1717200000000,
        spaActual: 0,
        msActual: 0,
        spaPlanned: 10,
        msPlanned: 20,
        combinedActual: 0,
        combinedPlanned: 30
      }
    ],
    nft: [
      {
        date: "2024-01-01",
        ts: 1704067200000,
        spaActual: 120,
        msActual: 170,
        spaPlanned: 130,
        msPlanned: 180,
        combinedActual: 290,
        combinedPlanned: 310
      },
      {
        date: "2024-06-01",
        ts: 1717200000000,
        spaActual: 0,
        msActual: 0,
        spaPlanned: 5,
        msPlanned: 10,
        combinedActual: 0,
        combinedPlanned: 15
      }
    ]
  },
  targets: {
    dev: "2024-06-01",
    sit: "2024-06-01",
    uat: "2024-06-01",
    nft: "2024-06-01"
  }
};

export const test = base.extend({
  page: async ({ page }, use) => {
    // Mock main-data endpoint
    await page.route("**/api/main-data", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mainData),
      }),
    );

    // Mock summary-data endpoint
    await page.route("**/api/summary-data", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(summaryData),
      }),
    );

    // Mock burndown-data endpoint - use wildcard to catch any URL containing burndown-data
    await page.route("**/burndown-data", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockBurndownData),
      }),
    );

    await use(page);
  },
});

export const expect = baseExpect;
