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

    await use(page);
  },
});

export const expect = baseExpect;
