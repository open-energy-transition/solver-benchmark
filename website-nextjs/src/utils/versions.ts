import { compareVersions } from "compare-versions";

const normalizeVersion = (version: string): string => {
  return version.replace(/\.dev(\d+)/, "-dev.$1"); // Replace `.dev0` with `-dev.0`
};

const getHighestVersion = (versions: string[]) => {
  if (!versions) {
    console.error("versions", versions);
  }
  const versionsData = versions.map((version) => ({
    normalized: normalizeVersion(version),
    original: version,
  }));

  const sortedVersions = versionsData.sort((a, b) =>
    compareVersions(a.normalized, b.normalized),
  );

  return sortedVersions.at(-1)?.original;
};

export { getHighestVersion };
