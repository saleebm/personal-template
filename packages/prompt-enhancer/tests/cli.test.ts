import { describe, it, expect } from "bun:test";
import { spawn } from "child_process";
import path from "path";

const CLI_PATH = path.join(
  process.cwd(),
  "packages/prompt-enhancer/src/bin/enhance-prompt.ts",
);

describe("CLI Interface", () => {
  it("should show help when --help flag is used", async () => {
    const result = await runCLI(["--help"]);

    expect(result.stdout).toContain("AI Dr. Prompt Enhancer CLI");
    expect(result.stdout).toContain("--mcp-config");
    expect(result.stdout).toContain("--use-mcp");
    expect(result.stdout).toContain("--search");
    expect(result.stdout).toContain("--urls");
    expect(result.code).toBe(0);
  });

  it("should handle basic prompt enhancement", async () => {
    const result = await runCLI(["Fix the login bug"]);

    expect(result.stdout).toContain("Enhancing prompt");
    expect(result.code).toBe(0);
  }, 15000);

  it("should handle file input", async () => {
    // Create test file
    const fs = await import("fs");
    const testFile = path.join(process.cwd(), "test-prompt.txt");
    fs.writeFileSync(testFile, "Test prompt from file");

    try {
      const result = await runCLI(["-f", testFile]);
      expect(result.stdout).toContain("Loaded prompt from");
      expect(result.code).toBe(0);
    } finally {
      // Clean up
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    }
  }, 15000);

  it("should handle MCP configuration option", async () => {
    const result = await runCLI([
      "Test prompt",
      "--mcp-config",
      "./test-mcp.json",
    ]);

    // Should at least parse the option without error
    expect(result.code).toBe(0);
  });

  it("should handle search queries option", async () => {
    const result = await runCLI([
      "Authentication system",
      "--search",
      "oauth,jwt,authentication",
    ]);

    expect(result.stdout).toContain("Search queries");
    expect(result.code).toBe(0);
  });

  it("should handle URLs option", async () => {
    const result = await runCLI([
      "Implement caching",
      "--urls",
      "https://example.com/docs",
    ]);

    expect(result.stdout).toContain("URLs");
    expect(result.code).toBe(0);
  });

  it("should handle workflow mode", async () => {
    const result = await runCLI(["Complex engineering task", "--workflow"]);

    expect(result.stdout).toContain("Workflow");
    expect(result.code).toBe(0);
  }, 20000);

  it("should handle debug mode", async () => {
    const result = await runCLI(["Test prompt", "--debug"]);

    expect(result.stdout).toContain("Debug mode enabled");
    expect(result.code).toBe(0);
  });

  it("should error when no prompt is provided", async () => {
    const result = await runCLI([]);

    expect(result.stdout).toContain("No prompt provided");
    expect(result.code).toBe(1);
  });
});

// Helper function to run CLI
async function runCLI(args: string[]): Promise<{
  stdout: string;
  stderr: string;
  code: number | null;
}> {
  return new Promise((resolve) => {
    const proc = spawn("bun", [CLI_PATH, ...args], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        // Set test environment
        NODE_ENV: "test",
        // Provide minimal API key to avoid errors
        GOOGLE_API_KEY: process.env["GOOGLE_API_KEY"] || "test-key",
      },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      resolve({ stdout, stderr, code });
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      proc.kill();
      resolve({ stdout, stderr, code: -1 });
    }, 30000);
  });
}
