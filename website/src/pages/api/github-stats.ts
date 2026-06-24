import type { NextApiRequest, NextApiResponse } from "next";

interface GitHubStats {
  contributors: number;
  issues: number;
  stars: number;
  forks: number;
}

// In-memory server-side cache — shared across all users
let cachedStats: GitHubStats | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { owner, repo } = req.query;

  if (typeof owner !== "string" || typeof repo !== "string") {
    return res.status(400).json({ error: "owner and repo are required" });
  }

  const ownerPattern = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
  const repoPattern = /^[A-Za-z0-9._-]{1,100}$/;

  if (!ownerPattern.test(owner) || !repoPattern.test(repo)) {
    return res.status(400).json({ error: "invalid owner or repo" });
  }

  const safeOwner = encodeURIComponent(owner);
  const safeRepo = encodeURIComponent(repo);
  const issuesQuery = new URLSearchParams({
    q: `repo:${owner}/${repo}+is:issue`,
  }).toString();

  // Return cached data if still fresh
  if (cachedStats && Date.now() - cacheTimestamp < CACHE_TTL) {
    return res.status(200).json(cachedStats);
  }

  try {
    const [repoResponse, issuesResponse] = await Promise.all([
      fetch(`https://api.github.com/repos/${safeOwner}/${safeRepo}`),
      fetch(`https://api.github.com/search/issues?${issuesQuery}`),
    ]);

    if (!repoResponse.ok || !issuesResponse.ok) {
      throw new Error("Failed to fetch GitHub data");
    }

    const repoData = await repoResponse.json();
    const issuesData = await issuesResponse.json();

    // Fetch contributors count (extract last page from Link header)
    const contributorsResponse = await fetch(
      `https://api.github.com/repos/${safeOwner}/${safeRepo}/contributors?per_page=1&anon=1`,
    );
    const linkHeader = contributorsResponse.headers.get("Link") || "";
    const match = linkHeader.match(/page=(\d+)>; rel="last"/);
    const contributorsCount = match ? parseInt(match[1], 10) : 1;

    const stats: GitHubStats = {
      contributors: contributorsCount,
      issues: issuesData.total_count,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
    };

    // Update server cache
    cachedStats = stats;
    cacheTimestamp = Date.now();

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=600");
    return res.status(200).json(stats);
  } catch (error) {
    // Serve stale cache if available, otherwise return zeros
    if (cachedStats) {
      return res.status(200).json(cachedStats);
    }
    return res.status(200).json({
      contributors: 0,
      issues: 0,
      stars: 0,
      forks: 0,
    });
  }
}
