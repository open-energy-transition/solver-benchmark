// import yaml from "js-yaml"
import yaml from "yaml";

/**
 * Convert a YAML file to JSON
 * @param filePath - Path to the YAML file
 * @returns Parsed JSON object
 */
const convertYamlToJson = (filePath: string) => {
  try {
    const fileContents = fs.readFileSync(filePath, "utf8")

    const jsonData = yaml.load(fileContents)

    return jsonData
  } catch (error) {
    console.error("Error converting YAML to JSON:", error)
    return null
  }
}


const fetchYamlData = async (filePath: string) => {
  try {
    // Fetch the YAML file from the public folder
    const response = await fetch(filePath);
    const yamlText = await response.text();

    // Parse YAML string into a JSON object
    const jsonData = yaml.parse(yamlText);
    console.log(jsonData);

    return jsonData;
  } catch (error) {
    console.error("Error fetching or parsing YAML:", error);
    return null;
  }
};


const getMetaData = () => {
  return fetchYamlData("/results/metadata.yaml")
}

export { getMetaData }
