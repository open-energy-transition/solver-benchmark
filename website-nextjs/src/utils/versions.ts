import { compareVersions } from "compare-versions"

const normalizeVersion = (version: string): string => {
  return version.replace(/\.dev(\d+)/, "-dev.$1") // Replace `.dev0` with `-dev.0`
}

const getHighestVersion = (versions: string[]) => {
  if (!versions) {
    console.log('versions', versions);

  }
  const normalizedVersions = versions.map(normalizeVersion)
  const sortedVersions = normalizedVersions.sort(compareVersions)
  return versions[
    normalizedVersions.indexOf(sortedVersions[sortedVersions.length - 1])
  ]
}

export { getHighestVersion }
