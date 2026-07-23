import yaml from "yaml";
import camelCase from "lodash.camelcase";
import { MetaData } from "@/types/meta-data";

function toCamelCase(obj: unknown, isTopLevel = true): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => toCamelCase(item, false));
  } else if (obj !== null && typeof obj === "object") {
    const record = obj as Record<string, unknown>;
    return Object.keys(record).reduce(
      (result, key) => {
        const newKey = isTopLevel ? key : camelCase(key); // Leave top-level keys as is
        result[newKey] = toCamelCase(record[key], false);
        return result;
      },
      {} as Record<string, unknown>,
    );
  }
  return obj;
}

const fetchYamlData = async (filePath: string) => {
  try {
    const response = await fetch(filePath);
    const yamlText = await response.text();

    const jsonData = yaml.parse(yamlText);

    return jsonData;
  } catch (error) {
    console.error("Error fetching or parsing YAML:", error);
    return null;
  }
};

const getMetaData = async (): Promise<{ problems: MetaData }> => {
  const rawData = await fetchYamlData("/results/metadata.yaml");

  const processedProblems = toCamelCase(
    (rawData as { problems: MetaData }).problems,
  );
  return {
    problems: processedProblems as MetaData,
  };
};

const getUniqueValues = <T, K extends keyof T>(data: T[], key: K): T[K][] =>
  Array.from(new Set(data.map((item) => item[key])));

export { getMetaData, getUniqueValues };
