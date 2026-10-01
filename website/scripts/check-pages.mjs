#!/usr/bin/env node

// Loads every page in urls.txt (see extract-sitemap-urls.mjs) in Chrome and
// fails if any of them:
//   - has something blocked by the site's Content Security Policy, e.g. a
//     script, font or stylesheet from a source the policy doesn't allow;
//   - shows a formula KaTeX couldn't render (it shows these in red instead of
//     failing the build).
// Neither breaks the build, so only a real browser catches them.
//
// Uses the same environment variables as run-a11y-tests.mjs:
//   CHROMEDRIVER_PATH  – path to the matching ChromeDriver binary (optional)
//   CHROME_BIN         – path to the Chrome binary (optional)
//   AXE_CHROME_OPTIONS – comma-separated Chrome args, without leading --
//   AXE_LOAD_DELAY     – ms to wait for the page to load (default 3000)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Builder, By, logging } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const urlsPath = path.resolve(__dirname, "urls.txt");
if (!fs.existsSync(urlsPath)) {
  console.error("urls.txt not found. Run extract-sitemap-urls.mjs first.");
  process.exit(1);
}
const urls = fs
  .readFileSync(urlsPath, "utf8")
  .split("\n")
  .map((url) => url.trim())
  .filter(Boolean);

const options = new chrome.Options();
const chromeArgs = (process.env.AXE_CHROME_OPTIONS || "headless=new")
  .split(/[;,]/)
  .map((arg) => arg.trim())
  .filter(Boolean);
options.addArguments(...chromeArgs.map((arg) => `--${arg}`));
if (process.env.CHROME_BIN) options.setChromeBinaryPath(process.env.CHROME_BIN);

// Collect the browser console, where Chrome reports blocked resources
const loggingPrefs = new logging.Preferences();
loggingPrefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);

const builder = new Builder()
  .forBrowser("chrome")
  .setChromeOptions(options)
  .setLoggingPrefs(loggingPrefs);
if (process.env.CHROMEDRIVER_PATH) {
  builder.setChromeService(
    new chrome.ServiceBuilder(process.env.CHROMEDRIVER_PATH),
  );
}

const loadDelay = Number(process.env.AXE_LOAD_DELAY || 3000);
const driver = await builder.build();
let failures = 0;

try {
  for (const url of urls) {
    await driver.get(url);
    await sleep(loadDelay);

    const problems = [];
    const logs = await driver.manage().logs().get(logging.Type.BROWSER);
    for (const entry of logs) {
      if (entry.message.includes("Content Security Policy")) {
        problems.push(
          `blocked by the Content Security Policy: ${entry.message}`,
        );
      }
    }
    for (const error of await driver.findElements(By.css(".katex-error"))) {
      problems.push(`formula KaTeX couldn't render: ${await error.getText()}`);
    }

    if (problems.length) {
      failures += problems.length;
      console.log(`❌ ${url}`);
      for (const problem of problems) console.log(`   ${problem}`);
    } else {
      console.log(`✅ ${url}`);
    }
  }
} finally {
  await driver.quit();
}

if (failures) {
  console.log(`\n${failures} problem(s) found.`);
  process.exit(1);
}
console.log(`\nNo problems found on ${urls.length} pages.`);
