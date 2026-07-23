import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const baseUrl = "http://localhost:3000";

  const routes = [
    "",
    "/key-insights",
    "/methodology",
    "/dashboard/solver-ranking",
    "/dashboard/benchmark-problem-set",
    "/dashboard/benchmark-summary",
    "/dashboard/solver-vs-all",
    "/dashboard/solver-vs-solver",
    "/dashboard/performance-history",
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map((route) => {
    return `  <url>
    <loc>${baseUrl}${route}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === "" ? "1.0" : "0.8"}</priority>
  </url>`;
  })
  .join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap);
  res.end();
}
