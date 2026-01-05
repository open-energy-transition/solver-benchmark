#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  // Read the URLs we extracted
  const urlsPath = path.resolve(__dirname, "urls.txt");

  if (!fs.existsSync(urlsPath)) {
    console.error("urls.txt not found. Run extract-sitemap-urls.mjs first.");
    process.exit(1);
  }

  const urls = fs
    .readFileSync(urlsPath, "utf8")
    .split("\n")
    .filter((url) => url.trim() !== "");

  console.log(`\nTesting ${urls.length} URLs for accessibility...\n`);

  let hasFailures = false;
  const results = [];

  // Test each URL
  for (const url of urls) {
    console.log("====================================================");
    console.log(`Testing: ${url}`);
    console.log("====================================================");

    try {
      // Run axe-core accessibility tests
      execSync(`axe "${url}" --tags wcag2a,wcag2aa --exit`, {
        stdio: "inherit",
        encoding: "utf8",
      });

      console.log("✅ No accessibility issues found\n");
      results.push({ url, status: "passed" });
    } catch (error) {
      console.log("❌ Accessibility issues found on this page\n");
      hasFailures = true;
      results.push({ url, status: "failed" });
    }
  }

  // Summary
  console.log("\n====================================================");
  console.log("SUMMARY");
  console.log("====================================================");

  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;

  console.log(`Total pages tested: ${urls.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (hasFailures) {
    console.log("\n❌ Some pages have accessibility issues. Please fix them.");
    process.exit(1);
  } else {
    console.log("\n✅ All pages passed accessibility tests!");
  }
} catch (error) {
  console.error("Error running accessibility tests:", error.message);
  process.exit(1);
}
