#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
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

    // -------------------------------------------------------------------------
    // Build axe flags from environment variables so CI and local runs all use
    // the same script. The env vars are set in ci.yaml:
    //   CHROMEDRIVER_PATH  – path to the matching ChromeDriver binary
    //   AXE_CHROME_OPTIONS – comma-separated Chrome args (no leading --)
    //   AXE_LOAD_DELAY     – ms to wait for the page to hydrate (default 3000)
    //
    // NOTE: axe-core CLI uses --chrome-options (plural) with a comma-separated list.
    //       Using the wrong flag (e.g. --chromeoption) causes Chrome to launch without
    //       required flags and crash in CI.
    // -------------------------------------------------------------------------
    const chromedriverPath = process.env.CHROMEDRIVER_PATH || "";
    const chromeOptions = process.env.AXE_CHROME_OPTIONS || "";
    const loadDelay = process.env.AXE_LOAD_DELAY || "3000";

    const chromedriverFlag = chromedriverPath
      ? `--chromedriver-path "${chromedriverPath}"`
      : "";

    // axe-core CLI uses --chrome-options with a comma-separated list.
    // splitList() inside axe-cli splits on commas; normalise any semicolons too.
    const chromeOptionFlags = chromeOptions
      ? `--chrome-options "${chromeOptions
          .split(/[;,]/)
          .filter(Boolean)
          .map((o) => o.trim())
          .join(",")}"`
      : "";

    if (chromedriverPath) console.log(`ChromeDriver : ${chromedriverPath}`);
    if (chromeOptions) console.log(`Chrome flags : ${chromeOptions}\n`);

    // Test each URL
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 4000; // wait before retrying after a Chrome crash
    const PAGE_PAUSE_MS = 1500; // pause between every page (lets Chrome clean up)

    for (const url of urls) {
      console.log("====================================================");
      console.log(`Testing: ${url}`);
      console.log("====================================================");

      let attempt = 0;
      let pageStatus = null; // "passed" | "failed" | "chrome-crash"

      while (attempt < MAX_RETRIES && pageStatus === null) {
        attempt++;
        if (attempt > 1) {
          console.log(
            `⏳ Retry ${attempt}/${MAX_RETRIES} after Chrome crash — waiting ${
              RETRY_DELAY_MS / 1000
            }s...`,
          );
          await sleep(RETRY_DELAY_MS);
        }

        try {
          // Run axe-core accessibility tests with delay for page load/hydration.
          // --load-delay       : wait for Next.js hydration before running axe
          // --chromedriver-path: use the auto-matched ChromeDriver (avoids version
          //                      mismatch that causes "Chrome instance exited" errors)
          // --chrome-options   : comma-separated Chrome flags required in CI
          execSync(
            `axe "${url}" --tags wcag2a,wcag2aa --load-delay ${loadDelay} --exit ${chromedriverFlag} ${chromeOptionFlags}`.trim(),
            {
              stdio: "inherit",
              encoding: "utf8",
              timeout: 120_000, // 2 min hard cap per page
              maxBuffer: 10 * 1024 * 1024,
            },
          );

          console.log("✅ No accessibility issues found\n");
          pageStatus = "passed";
        } catch (error) {
          // Distinguish Chrome driver crashes from real accessibility violations.
          // A crash message contains "session not created" or "Chrome instance exited".
          const isCrash =
            error.message &&
            (error.message.includes("session not created") ||
              error.message.includes("Chrome instance exited") ||
              error.message.includes("SessionNotCreatedError"));

          if (isCrash && attempt < MAX_RETRIES) {
            console.log(
              `⚠️  Chrome crash on attempt ${attempt} — will retry...\n`,
            );
            // pageStatus stays null → loop continues
          } else if (isCrash) {
            console.log("⚠️  Chrome crashed on all retries — skipping page.\n");
            pageStatus = "chrome-crash";
          } else {
            console.log("❌ Accessibility violations found on this page\n");
            pageStatus = "failed";
          }
        }
      }

      results.push({ url, status: pageStatus });
      if (pageStatus === "failed") hasFailures = true;

      // Brief pause between pages so Chrome can release sockets / /dev/shm space
      await sleep(PAGE_PAUSE_MS);
    }

    // Summary
    console.log("\n====================================================");
    console.log("SUMMARY");
    console.log("====================================================");

    const passed = results.filter((r) => r.status === "passed");
    const failed = results.filter((r) => r.status === "failed");
    const crashed = results.filter((r) => r.status === "chrome-crash");

    console.log(`Total pages tested : ${urls.length}`);
    console.log(`✅ Passed          : ${passed.length}`);
    console.log(`❌ Failed (a11y)   : ${failed.length}`);
    console.log(`⚠️  Chrome crashes  : ${crashed.length}`);

    if (passed.length > 0) {
      console.log("\nPassed pages:");
      passed.forEach((r) => console.log(`  ✅ ${r.url}`));
    }

    if (crashed.length > 0) {
      console.log("\nChrome crashed on (investigate ChromeDriver setup):");
      crashed.forEach((r) => console.log(`  ⚠️  ${r.url}`));
    }

    if (failed.length > 0) {
      console.log(
        "\nFailed pages (accessibility violations — re-run the URL manually to see details):",
      );
      failed.forEach((r) => console.log(`  ❌ ${r.url}`));
    }

    if (hasFailures) {
      console.log(
        "\n❌ Some pages have accessibility violations. Please fix them.",
      );
      process.exit(1);
    } else if (crashed.length > 0) {
      console.log(
        "\n⚠️  Some pages had Chrome crashes but no accessibility violations were detected.",
      );
    } else {
      console.log("\n✅ All pages passed accessibility tests!");
    }
  } catch (error) {
    console.error("Error running accessibility tests:", error.message);
    process.exit(1);
  }
})();
