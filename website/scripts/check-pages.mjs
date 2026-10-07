#!/usr/bin/env node

// Loads every page in urls.txt (see extract-sitemap-urls.mjs) in Chrome,
// opens each of its hover pop-ups, and fails if any page:
//   - doesn't load, e.g. returns a 404;
//   - has something blocked by the site's Content Security Policy, e.g. a
//     script, font or stylesheet from a source the policy doesn't allow;
//   - shows a formula KaTeX couldn't render (it shows these in red instead of
//     failing the build), on the page or in a pop-up.
// None of these breaks the build, so only a real browser catches them.
//
// Pop-ups are rendered only once they open, so the check opens each one. It fails if it finds no formulas in any pop-up, since the SGM
// explanation pop-ups contain some: that would mean the pop-ups weren't
// opened, e.g. because their markup changed.
//
// Uses the same environment variables as run-a11y-tests.mjs:
//   CHROMEDRIVER_PATH  – path to the matching ChromeDriver binary (optional)
//   CHROME_BIN         – path to the Chrome binary (optional)
//   AXE_CHROME_OPTIONS – comma-separated Chrome args, without leading --
//   AXE_LOAD_DELAY     – ms to wait for the page to load (default 3000)
//   POPUP_OPEN_DELAY   – ms to wait for a pop-up to open (default 250)

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

// reactjs-popup gives each trigger aria-describedby="popup-<n>", the id of
// its content while open
const POPUP_TRIGGERS = '[aria-describedby^="popup-"]';

const loadDelay = Number(process.env.AXE_LOAD_DELAY || 3000);
const popupDelay = Number(process.env.POPUP_OPEN_DELAY || 250);
const driver = await builder.build();
let failures = 0;
let popupFormulas = 0;

const findKatexErrors = async (element) => {
  const errors = [];
  for (const error of await element.findElements(By.css(".katex-error"))) {
    errors.push(await error.getText());
  }
  return errors;
};

// Opens every pop-up on the page and checks its formulas, returning how many
// pop-ups opened and how many formulas they had. The hover is simulated with
// the mouseover/mouseout events React turns into onMouseEnter/onMouseLeave,
// on all triggers at once: moving the real mouse over each trigger in turn
// is slow, and misses triggers covered by other elements in a small window.
const checkPopups = async (problems) => {
  const results = await driver.executeAsyncScript(
    `const [selector, delay, done] = arguments;
    const triggers = [...document.querySelectorAll(selector)];
    const hover = (type) => {
      for (const trigger of triggers) {
        trigger.dispatchEvent(
          new MouseEvent(type, { bubbles: true, relatedTarget: document.body }),
        );
      }
    };
    hover("mouseover");
    setTimeout(() => {
      const results = triggers.map((trigger) => {
        const id = trigger.getAttribute("aria-describedby");
        const content = document.getElementById(id);
        return {
          opened: !!content,
          formulas: content ? content.querySelectorAll(".katex").length : 0,
          errors: content
            ? [...content.querySelectorAll(".katex-error")].map(
                (error) => error.textContent,
              )
            : [],
        };
      });
      hover("mouseout");
      done(results);
    }, delay);`,
    POPUP_TRIGGERS,
    popupDelay,
  );
  for (const { errors } of results) {
    for (const error of errors) {
      problems.push(`formula KaTeX couldn't render in a pop-up: ${error}`);
    }
  }
  return {
    opened: results.filter(({ opened }) => opened).length,
    formulas: results.reduce((sum, { formulas }) => sum + formulas, 0),
  };
};

try {
  for (const url of urls) {
    const problems = [];

    const response = await fetch(url);
    if (!response.ok) {
      problems.push(`returned HTTP ${response.status}`);
    }

    await driver.get(url);
    await sleep(loadDelay);
    const pageFormulas = (await driver.findElements(By.css(".katex"))).length;
    for (const error of await findKatexErrors(driver)) {
      problems.push(`formula KaTeX couldn't render: ${error}`);
    }
    const popups = await checkPopups(problems);
    popupFormulas += popups.formulas;

    const logs = await driver.manage().logs().get(logging.Type.BROWSER);
    for (const entry of logs) {
      if (entry.message.includes("Content Security Policy")) {
        problems.push(
          `blocked by the Content Security Policy: ${entry.message}`,
        );
      }
    }
    const summary =
      `${pageFormulas} formula(s), ${popups.opened} pop-up(s) with ` +
      `${popups.formulas} formula(s)`;
    if (problems.length) {
      failures += problems.length;
      console.log(`❌ ${url} (${summary})`);
      for (const problem of problems) console.log(`   ${problem}`);
    } else {
      console.log(`✅ ${url} (${summary})`);
    }
  }
} finally {
  await driver.quit();
}

if (popupFormulas === 0) {
  failures++;
  console.log(
    "\n❌ No formulas found in any pop-up, though the SGM explanation " +
      "pop-ups have some: the pop-ups probably weren't opened.",
  );
}

if (failures) {
  console.log(`\n${failures} problem(s) found.`);
  process.exit(1);
}
console.log(`\nNo problems found on ${urls.length} pages.`);
