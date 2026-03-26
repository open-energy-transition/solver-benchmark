import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    responseLimit: false, // Disable Next.js response size limit
    bodyParser: false, // Disable body parsing for streaming
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { url } = req.query;
  if (!url || typeof url !== "string") {
    res.status(400).send("Missing or invalid url");
    return;
  }

  try {
    // Use native Node.js http/https for streaming
    const fetchModule = await import("node-fetch");
    const fetch = fetchModule.default || fetchModule;
    const response = await fetch(url);

    if (!response.ok || !response.body) {
      res.status(response.status).send("Failed to fetch file");
      return;
    }

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      response.headers.get("content-type") || "application/octet-stream",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${url.split("/").pop()}"`,
    );

    // Pipe the response body directly to the client
    response.body.pipe(res);
    // Prevent Next.js from automatically ending the response
    // (it will end when the stream finishes)
  } catch (err) {
    console.error("Error fetching file:", err);
    res.status(500).send("Error fetching file");
  }
}
