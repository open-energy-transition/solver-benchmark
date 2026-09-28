import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    responseLimit: false, // Disable Next.js response size limit
    bodyParser: false, // Disable body parsing for streaming
  },
};

// Only benchmark problem files are proxied, so this can't be used to fetch
// arbitrary URLs through the website.
const ALLOWED_URL_PREFIXES = [
  "https://storage.googleapis.com/solver-benchmarks/",
  "https://raw.githubusercontent.com/jump-dev/",
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    res.status(400).send("Missing or invalid url");
    return;
  }

  // Check the parsed URL, which resolves e.g. "../" segments
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    res.status(400).send("Missing or invalid url");
    return;
  }
  if (
    !ALLOWED_URL_PREFIXES.some((prefix) => parsedUrl.href.startsWith(prefix))
  ) {
    res.status(403).send("Only benchmark problem files can be downloaded");
    return;
  }
  const fileName = (parsedUrl.pathname.split("/").pop() || "download").replace(
    /[^A-Za-z0-9._+-]/g,
    "_",
  );

  try {
    // Use native Node.js http/https for streaming
    const fetchModule = await import("node-fetch");
    const fetch = fetchModule.default || fetchModule;
    // Don't follow redirects, which could lead outside the allowed URLs
    const response = await fetch(parsedUrl.href, { redirect: "error" });

    if (!response.ok || !response.body) {
      res.status(response.status).send("Failed to fetch file");
      return;
    }

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "application/octet-stream",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    // Pipe the response body directly to the client
    response.body.pipe(res);
    // Prevent Next.js from automatically ending the response
    // (it will end when the stream finishes)
  } catch (err) {
    console.error("Error fetching file:", err);
    res.status(500).send("Error fetching file");
  }
}
