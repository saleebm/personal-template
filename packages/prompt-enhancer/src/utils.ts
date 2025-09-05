import { resolve, join } from "path";

/**
 * Generates a timestamp-based filename for prompt storage
 * Format: prompt_YYYYMMDD_HHMMSS.md
 * Example: prompt_20250828_001228.md
 */
export function generatePromptFilename(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `prompt_${year}${month}${day}_${hours}${minutes}${seconds}.md`;
}

/**
 * Generates the full path for prompt storage with date directory structure
 * Format: .ai-dr/crafted/YYYY-MM-DD/prompt_YYYYMMDD_HHMMSS.md
 * Example: .ai-dr/crafted/2025-08-28/prompt_20250828_001228.md
 */
export function generatePromptPath(
  projectPath: string,
  outputDir: string = ".ai-dr/crafted",
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  const dateDir = `${year}-${month}-${day}`;
  const filename = generatePromptFilename();

  return resolve(projectPath, outputDir, dateDir, filename);
}

/**
 * Ensures the directory structure exists for the given file path
 */
export async function ensurePromptDirectory(filePath: string): Promise<void> {
  const { dirname } = await import("path");
  const { mkdir } = await import("fs/promises");

  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
}

/**
 * Gets the project root by traversing up from current directory
 * until it finds package.json or .git directory
 */
export function findProjectRoot(startPath: string = process.cwd()): string {
  const { existsSync } = require("fs");
  const { dirname, join } = require("path");

  let currentPath = resolve(startPath);
  const root = dirname(currentPath);

  while (currentPath !== root) {
    if (
      existsSync(join(currentPath, "package.json")) ||
      existsSync(join(currentPath, ".git"))
    ) {
      return currentPath;
    }
    currentPath = dirname(currentPath);
  }

  return startPath; // Fallback to original path if no project root found
}
