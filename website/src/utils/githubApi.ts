interface GitHubStats {
  contributors: number;
  issues: number;
  stars: number;
  forks: number;
}

const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const CACHE_KEY_PREFIX = "github_stats_";

function getCachedStats(cacheKey: string): GitHubStats | null {
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(cacheKey);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCachedStats(cacheKey: string, data: GitHubStats): void {
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({ data, timestamp: Date.now() }),
    );
  } catch {
    // localStorage might be full or unavailable — silently ignore
  }
}

export async function fetchGitHubStats(
  owner: string,
  repo: string,
): Promise<GitHubStats> {
  const cacheKey = `${CACHE_KEY_PREFIX}${owner}/${repo}`;

  // Return cached data if fresh
  const cached = getCachedStats(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `/api/github-stats?owner=${encodeURIComponent(
        owner,
      )}&repo=${encodeURIComponent(repo)}`,
    );
    if (!response.ok) throw new Error("Failed to fetch repository data");
    const data: GitHubStats = await response.json();

    // Cache before returning
    setCachedStats(cacheKey, data);
    return data;
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    return {
      contributors: 0,
      issues: 0,
      stars: 0,
      forks: 0,
    };
  }
}
