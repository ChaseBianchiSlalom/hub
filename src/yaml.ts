function parseScalar(rawValue: string): string | boolean {
  const value = rawValue.trim();
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return value;
}

export function parseSimpleYamlDocument(content: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  let index = 0;
  while (index < lines.length) {
    const rawLine = lines[index];
    const trimmed = rawLine.trim();
    index += 1;

    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }

    if (/^\s/.test(rawLine)) {
      throw new Error(`Unsupported indentation at line ${index}: ${rawLine}`);
    }

    const keyMatch = rawLine.match(/^([A-Za-z0-9_-]+):(?:\s(.*))?$/);
    if (!keyMatch) {
      throw new Error(`Invalid YAML line ${index}: ${rawLine}`);
    }

    const [, key, rawValue = ""] = keyMatch;

    if (rawValue === ">") {
      const folded: string[] = [];
      while (index < lines.length) {
        const nextLine = lines[index];
        if (nextLine.trim() === "") {
          index += 1;
          continue;
        }

        if (!nextLine.startsWith("  ")) {
          break;
        }

        folded.push(nextLine.trim());
        index += 1;
      }

      result[key] = folded.join(" ");
      continue;
    }

    if (rawValue === "") {
      const listValues: string[] = [];
      while (index < lines.length) {
        const nextLine = lines[index];
        const nextTrimmed = nextLine.trim();

        if (nextTrimmed === "") {
          index += 1;
          continue;
        }

        if (!nextLine.startsWith("  ")) {
          break;
        }

        const listMatch = nextLine.match(/^\s*-\s(.*)$/);
        if (!listMatch) {
          throw new Error(`Unsupported nested YAML at line ${index + 1}: ${nextLine}`);
        }

        listValues.push(parseScalar(listMatch[1]));
        index += 1;
      }

      result[key] = listValues;
      continue;
    }

    if (rawValue.trim() === "[]") {
      result[key] = [];
      continue;
    }

    result[key] = parseScalar(rawValue);
  }

  return result;
}
