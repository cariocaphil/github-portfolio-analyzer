const TECHNOLOGY_ALIASES: Record<string, string> = {
  node: "Node.js",
  "nodejs": "Node.js",
  "node.js": "Node.js",
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  reactjs: "React",
  "next": "Next.js",
  nextjs: "Next.js",
  "next.js": "Next.js",
  "github actions": "GitHub Actions",
  "spring boot": "Spring Boot",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
};

const NOISE_PREFIXES = [
  "repositories with",
  "portfolio summary",
  "primary languages",
  "topics",
  "technologies",
  "scripts",
  "word count",
  "section headings",
  "days since",
  "repository age",
  "created",
  "last push",
  "last update",
  "dependency:",
  "package name:",
];

const NOISE_CONTAINS = [
  "http://",
  "https://",
  "readme",
  "repository metadata",
  "root entries",
  "workflow",
];

function toTitleCase(value: string): string {
  return value
    .split(" ")
    .map((chunk) =>
      chunk ? chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase() : chunk,
    )
    .join(" ");
}

export function normalizeTechnologyName(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return null;
  }

  const lower = trimmed.toLowerCase();
  if (NOISE_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return null;
  }
  if (NOISE_CONTAINS.some((item) => lower.includes(item))) {
    return null;
  }
  if (/^\d+$/.test(trimmed)) {
    return null;
  }
  if (trimmed.length > 40) {
    return null;
  }
  if (trimmed.split(" ").length > 3) {
    return null;
  }
  if (!/[a-z]/i.test(trimmed)) {
    return null;
  }

  const alias = TECHNOLOGY_ALIASES[lower];
  if (alias) {
    return alias;
  }

  if (/^[@a-z0-9][@a-z0-9.+#/-]*$/i.test(trimmed)) {
    return trimmed.includes(".") ? trimmed : toTitleCase(trimmed);
  }

  if (
    /^[@a-z0-9][@a-z0-9.+#/-]*( [@a-z0-9][@a-z0-9.+#/-]*){1,2}$/i.test(trimmed)
  ) {
    return toTitleCase(trimmed);
  }

  return null;
}
