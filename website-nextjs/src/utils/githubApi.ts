interface GitHubStats {
  contributors: number;
  issues: number;
  stars: number;
  forks: number;
}

export async function fetchGitHubStats(
  owner: string,
  repo: string,
): Promise<GitHubStats> {
  try {
    // Fetch stars and forks from repo info
    const repoResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
    );
    if (!repoResponse.ok) throw new Error("Failed to fetch repository data");
    const repoData = await repoResponse.json();

    // Fetch contributors count
    const contributorsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=1&anon=1`,
    );
    if (!contributorsResponse.ok)
      throw new Error("Failed to fetch contributors data");
    // Get total count from Link header
    const linkHeader = contributorsResponse.headers.get("Link") || "";
    const match = linkHeader.match(/page=(\d+)>; rel="last"/);
    const contributorsCount = match ? parseInt(match[1], 10) : 1;

    // Fetch open issues count
    const issuesResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=1`,
    );
    if (!issuesResponse.ok) throw new Error("Failed to fetch issues data");
    const linkHeaderIssues = issuesResponse.headers.get("Link") || "";
    const matchIssues = linkHeaderIssues.match(/page=(\d+)>; rel="last"/);
    const issuesCount = matchIssues ? parseInt(matchIssues[1], 10) : 0;

    return {
      contributors: contributorsCount,
      issues: issuesCount,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
    };
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
