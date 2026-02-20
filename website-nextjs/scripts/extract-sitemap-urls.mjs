#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SITEMAP_URL =
  process.env.SITEMAP_URL || "http://localhost:3000/api/sitemap.xml";

console.log(`Fetching sitemap from: ${SITEMAP_URL}`);

try {
  // Fetch sitemap from running server
  const response = await fetch(SITEMAP_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch sitemap: ${response.status} ${response.statusText}`,
    );
  }

  const sitemapContent = await response.text();

  // Parse XML and extract URLs
  const urlRegex = /<loc>(.*?)<\/loc>/g;
  const matches = [...sitemapContent.matchAll(urlRegex)];

  const urls = matches.map((match) => match[1]);

  if (urls.length === 0) {
    console.error("No URLs found in sitemap");
    process.exit(1);
  }

  console.log(`Found ${urls.length} URLs in sitemap`);

  // Save URLs to file
  const outputPath = path.resolve(__dirname, "urls.txt");
  fs.writeFileSync(outputPath, urls.join("\n"));

  console.log(`URLs saved to: ${outputPath}`);
  console.log("\nURLs to test:");
  urls.forEach((url) => console.log(`  - ${url}`));
} catch (error) {
  console.error("Error fetching or processing sitemap:", error.message);
  console.error("\nMake sure the Next.js server is running:");
  console.error("  npm run build && npm start");
  process.exit(1);
}
