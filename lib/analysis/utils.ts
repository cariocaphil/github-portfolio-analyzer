import type { EvidenceSource } from "@/lib/models/evidence";
import { randomUUID } from "crypto";

export function createEvidenceSource(
  repository: string,
  path: string,
  description: string,
  facts: string[],
  githubUrl?: string,
): EvidenceSource {
  return {
    id: randomUUID(),
    repository,
    path,
    description,
    facts,
    githubUrl,
  };
}

export function daysSince(isoDate: string): number {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export function parsePackageJson(content: string): {
  name?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
} | null {
  try {
    return JSON.parse(content) as {
      name?: string;
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
  } catch {
    return null;
  }
}

export function readmeSections(content: string): string[] {
  const matches = content.match(/^#{1,3}\s+.+$/gm);
  return matches ?? [];
}

export function workflowMentionsTests(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    lower.includes("test") ||
    lower.includes("jest") ||
    lower.includes("pytest") ||
    lower.includes("mocha") ||
    lower.includes("vitest") ||
    lower.includes("rspec")
  );
}

export function workflowMentionsDeploy(content: string): boolean {
  const lower = content.toLowerCase();
  return (
    lower.includes("deploy") ||
    lower.includes("docker") ||
    lower.includes("kubernetes") ||
    lower.includes("vercel") ||
    lower.includes("netlify") ||
    lower.includes("publish")
  );
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
