// Extension: playwright-tester
// Playwright E2E testing skill for the Family Planner app
//
// Provides tools for running, listing, and analyzing Playwright tests.
// Injects project-specific testing context (HashRouter URLs, Firefox project, etc.).

import { execFile } from "node:child_process";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { approveAll } from "@github/copilot-sdk";
import { joinSession } from "@github/copilot-sdk/extension";

const cwd = process.cwd();
const E2E_DIR = join(cwd, "e2e");
const SCREENSHOT_DIR = join(cwd, "test-screenshots");

// ── Helpers ─────────────────────────────────────────────────────────

function runCommand(command, args, options = {}) {
    return new Promise((resolve) => {
        const proc = execFile(command, args, {
            cwd,
            maxBuffer: 10 * 1024 * 1024,
            timeout: options.timeout || 300000,
            ...options,
        }, (err, stdout, stderr) => {
            resolve({
                exitCode: err ? err.code || 1 : 0,
                stdout: stdout || "",
                stderr: stderr || "",
            });
        });
    });
}

function listTestFiles() {
    if (!existsSync(E2E_DIR)) return [];
    return readdirSync(E2E_DIR)
        .filter((f) => f.endsWith(".spec.ts"))
        .map((f) => join(E2E_DIR, f));
}

function extractTestNames(filePath) {
    const content = readFileSync(filePath, "utf-8");
    const tests = [];
    const describeStack = [];

    for (const line of content.split("\n")) {
        const describeMatch = line.match(/test\.describe\(\s*['"`](.+?)['"`]/);
        if (describeMatch) {
            describeStack.push(describeMatch[1]);
        }

        const testMatch = line.match(/^\s*test\(\s*['"`](.+?)['"`]/);
        if (testMatch) {
            const prefix = describeStack.length > 0 ? describeStack.join(" › ") + " › " : "";
            tests.push(prefix + testMatch[1]);
        }

        // Track closing braces for describe blocks (simplified)
        if (line.match(/^\s*\}\s*\)\s*;?\s*$/) && describeStack.length > 0) {
            describeStack.pop();
        }
    }
    return tests;
}

function parseTestOutput(stdout, stderr) {
    const combined = stdout + "\n" + stderr;
    const passedMatch = combined.match(/(\d+)\s+passed/);
    const failedMatch = combined.match(/(\d+)\s+failed/);
    const skippedMatch = combined.match(/(\d+)\s+skipped/);

    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;

    // Extract failure details
    const failures = [];
    const failureRegex = /\d+\)\s+\[.+?\]\s+›\s+(.+?)(?:\n\s+Error:.+)/g;
    let match;
    while ((match = failureRegex.exec(combined)) !== null) {
        failures.push(match[1].trim());
    }

    return { passed, failed, skipped, total: passed + failed + skipped, failures };
}

function truncateOutput(text, maxLen = 8000) {
    if (text.length <= maxLen) return text;
    const half = Math.floor(maxLen / 2) - 50;
    return text.slice(0, half) + "\n\n... [truncated] ...\n\n" + text.slice(-half);
}

// ── Session ─────────────────────────────────────────────────────────

const session = await joinSession({
    onPermissionRequest: approveAll,
    hooks: {
        onSessionStart: async () => {
            return {
                additionalContext: `## Playwright Testing Context

This project has Playwright E2E tests in the \`e2e/\` directory. Key conventions:

- **HashRouter**: All test URLs MUST use \`/#/\` prefix (e.g., \`page.goto('/#/adventures')\`, NOT \`page.goto('/adventures')\`)
- **Browser**: Use \`--project=firefox\` (Chromium requires system-level \`libnspr4\` which is not installed)
- **Run command**: \`npx playwright test --project=firefox --workers=1\`
- **Test files**: ${listTestFiles().map(f => relative(cwd, f)).join(", ") || "none found"}
- **Screenshots**: Saved to \`test-screenshots/\`
- **Console error filters**: Tests exclude Wake Lock, Azure OpenAI CORS, MSAL, and daily spark errors (expected in test env)

Use the \`playwright_run\`, \`playwright_list\`, and \`playwright_report\` tools for testing workflows.`,
            };
        },

        onPostToolUse: async (input) => {
            // Remind to test after UI file edits
            if (input.toolName === "edit" || input.toolName === "create") {
                const filePath = String(input.toolArgs?.path || "");
                const isUIFile = filePath.includes("/components/") ||
                    filePath.includes("/pages/") ||
                    filePath.includes("/contexts/") ||
                    filePath.endsWith(".css");
                if (isUIFile && input.toolResult?.resultType !== "failure") {
                    return {
                        additionalContext: "Reminder: A UI file was modified. Run Playwright tests after completing changes to verify nothing is broken. Use the `playwright_run` tool.",
                    };
                }
            }
        },
    },

    tools: [
        // ── playwright_run ──────────────────────────────────────────
        {
            name: "playwright_run",
            description: "Run Playwright E2E tests. Can run all tests, a specific file, or tests matching a grep pattern. Returns pass/fail summary and failure details. Uses Firefox project (Chromium needs system deps).",
            parameters: {
                type: "object",
                properties: {
                    file: {
                        type: "string",
                        description: "Test file to run (e.g., 'family-hub' or 'e2e/family-hub.spec.ts'). Omit to run all tests.",
                    },
                    grep: {
                        type: "string",
                        description: "Filter tests by name pattern (e.g., 'Adventures', 'touch target'). Passed to --grep flag.",
                    },
                    workers: {
                        type: "number",
                        description: "Number of parallel workers (default: 1 for reliability).",
                    },
                    headed: {
                        type: "boolean",
                        description: "Run with visible browser (default: false).",
                    },
                    update_snapshots: {
                        type: "boolean",
                        description: "Update test snapshots (default: false).",
                    },
                },
            },
            handler: async (args) => {
                const playwrightArgs = ["playwright", "test"];

                // Resolve file path
                if (args.file) {
                    let file = args.file;
                    if (!file.endsWith(".spec.ts")) {
                        file = `e2e/${file}.spec.ts`;
                    }
                    if (!file.startsWith("e2e/")) {
                        file = `e2e/${file}`;
                    }
                    const fullPath = join(cwd, file);
                    if (!existsSync(fullPath)) {
                        return {
                            textResultForLlm: `Test file not found: ${file}\n\nAvailable test files:\n${listTestFiles().map(f => "  - " + relative(cwd, f)).join("\n")}`,
                            resultType: "failure",
                        };
                    }
                    playwrightArgs.push(file);
                }

                playwrightArgs.push("--project=firefox");
                playwrightArgs.push(`--workers=${args.workers || 1}`);
                playwrightArgs.push("--reporter=line");

                if (args.grep) {
                    playwrightArgs.push("--grep", args.grep);
                }
                if (args.headed) {
                    playwrightArgs.push("--headed");
                }
                if (args.update_snapshots) {
                    playwrightArgs.push("--update-snapshots");
                }

                await session.log(`Running: npx ${playwrightArgs.join(" ")}`, { ephemeral: true });

                const result = await runCommand("npx", playwrightArgs);
                const combined = result.stdout + "\n" + result.stderr;
                const stats = parseTestOutput(result.stdout, result.stderr);

                let summary = `## Playwright Test Results\n\n`;
                summary += `**Status:** ${stats.failed === 0 ? "✅ ALL PASSED" : "❌ FAILURES DETECTED"}\n`;
                summary += `**Passed:** ${stats.passed} | **Failed:** ${stats.failed}`;
                if (stats.skipped > 0) summary += ` | **Skipped:** ${stats.skipped}`;
                summary += ` | **Total:** ${stats.total}\n\n`;

                if (stats.failures.length > 0) {
                    summary += `### Failed Tests:\n`;
                    for (const f of stats.failures) {
                        summary += `- ❌ ${f}\n`;
                    }
                    summary += "\n";
                }

                if (stats.failed > 0) {
                    summary += `### Output:\n\`\`\`\n${truncateOutput(combined)}\n\`\`\`\n`;
                }

                return {
                    textResultForLlm: summary,
                    resultType: stats.failed === 0 ? "success" : "failure",
                };
            },
        },

        // ── playwright_list ─────────────────────────────────────────
        {
            name: "playwright_list",
            description: "List all Playwright test files and their test names. Useful for discovering available tests before running them.",
            parameters: {
                type: "object",
                properties: {
                    file: {
                        type: "string",
                        description: "Show tests for a specific file only (e.g., 'family-hub').",
                    },
                },
            },
            handler: async (args) => {
                const files = listTestFiles();
                if (files.length === 0) {
                    return "No test files found in e2e/ directory.";
                }

                let output = "## Playwright Test Files\n\n";
                let totalTests = 0;

                for (const file of files) {
                    const relPath = relative(cwd, file);
                    const baseName = relPath.replace("e2e/", "").replace(".spec.ts", "");

                    if (args.file && !baseName.includes(args.file)) continue;

                    const tests = extractTestNames(file);
                    totalTests += tests.length;

                    output += `### ${relPath} (${tests.length} tests)\n`;
                    for (const t of tests) {
                        output += `  - ${t}\n`;
                    }
                    output += "\n";
                }

                output += `**Total: ${totalTests} tests across ${files.length} files**\n`;
                output += `\nRun with: \`playwright_run\` tool or \`npx playwright test --project=firefox\``;

                return output;
            },
        },

        // ── playwright_report ───────────────────────────────────────
        {
            name: "playwright_report",
            description: "Show the latest Playwright HTML test report in the browser, or list available test screenshots.",
            parameters: {
                type: "object",
                properties: {
                    action: {
                        type: "string",
                        enum: ["screenshots", "open_report"],
                        description: "'screenshots' lists saved test screenshots. 'open_report' opens the HTML report.",
                    },
                },
                required: ["action"],
            },
            handler: async (args) => {
                if (args.action === "screenshots") {
                    if (!existsSync(SCREENSHOT_DIR)) {
                        return "No test-screenshots/ directory found. Run tests first to generate screenshots.";
                    }
                    const files = readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith(".png"));
                    if (files.length === 0) {
                        return "No screenshots found in test-screenshots/.";
                    }
                    let output = `## Test Screenshots (${files.length} files)\n\n`;
                    for (const f of files) {
                        output += `- test-screenshots/${f}\n`;
                    }
                    return output;
                }

                if (args.action === "open_report") {
                    const reportDir = join(cwd, "playwright-report");
                    if (!existsSync(reportDir)) {
                        return "No playwright-report/ directory found. Run tests first (they generate an HTML report by default).";
                    }
                    await runCommand("npx", ["playwright", "show-report", "--host", "0.0.0.0"], { timeout: 5000 });
                    return "Playwright HTML report server started. Check your browser.";
                }

                return "Unknown action. Use 'screenshots' or 'open_report'.";
            },
        },

        // ── playwright_create_test ──────────────────────────────────
        {
            name: "playwright_create_test",
            description: "Generate a Playwright test skeleton for a given page/feature. Returns a code template with proper HashRouter URLs, console error filters, and touch target checks that follows project conventions.",
            parameters: {
                type: "object",
                properties: {
                    feature_name: {
                        type: "string",
                        description: "Name of the feature (e.g., 'Shopping List', 'Weather Widget').",
                    },
                    route: {
                        type: "string",
                        description: "Route path without hash prefix (e.g., '/shopping-list').",
                    },
                    test_file: {
                        type: "string",
                        description: "Output file name without path (e.g., 'shopping-list.spec.ts'). Defaults to kebab-case of feature name.",
                    },
                },
                required: ["feature_name", "route"],
            },
            handler: async (args) => {
                const name = args.feature_name;
                const route = args.route.startsWith("/") ? args.route : `/${args.route}`;
                const hashRoute = `/#${route}`;
                const fileName = args.test_file || `${name.toLowerCase().replace(/\s+/g, "-")}.spec.ts`;
                const filePath = `e2e/${fileName}`;

                const template = `import { test, expect } from '@playwright/test';

/**
 * ${name} — E2E Test Suite
 * NOTE: This app uses HashRouter — all URLs must use /#/ prefix.
 */

test.describe('${name}', () => {

  test('page loads correctly', async ({ page }) => {
    await page.goto('${hashRoute}');
    await page.waitForLoadState('networkidle');

    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();

    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('${name}');

    await page.screenshot({
      path: 'test-screenshots/${fileName.replace(".spec.ts", "")}-page.png',
      fullPage: true,
    });
  });

  test('touch targets meet 44x44px minimum', async ({ page }) => {
    await page.goto('${hashRoute}');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const buttons = await page.locator('button:visible').all();
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        const text = await button.textContent();
        expect(box.width, \`Button "\${text?.trim()}" width >= 44px\`).toBeGreaterThanOrEqual(44);
        expect(box.height, \`Button "\${text?.trim()}" height >= 44px\`).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('no critical console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error' &&
          !msg.text().includes('Wake Lock') &&
          !msg.text().includes('Azure OpenAI') &&
          !msg.text().includes('net::ERR') &&
          !msg.text().includes('favicon') &&
          !msg.text().includes('Failed to fetch') &&
          !msg.text().includes('Failed to generate') &&
          !msg.text().includes('MSAL') &&
          !msg.text().includes('Cross-Origin') &&
          !msg.text().includes('openai.azure.com') &&
          !msg.text().includes('daily spark')) {
        errors.push(msg.text());
      }
    });

    await page.goto('${hashRoute}');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    expect(errors, 'Should have no critical console errors').toHaveLength(0);
  });

  test('is accessible via sidebar nav', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('networkidle');

    const navLink = page.locator('a[href="#${route}"]');
    await expect(navLink.first()).toBeVisible({ timeout: 5000 });

    await navLink.first().click();
    await page.waitForLoadState('networkidle');

    const root = page.locator('#root');
    await expect(root).not.toBeEmpty();
  });

  // TODO: Add feature-specific tests below
  // Example:
  // test('can interact with main feature', async ({ page }) => {
  //   await page.goto('${hashRoute}');
  //   await page.waitForLoadState('networkidle');
  //   // ... your test logic
  // });
});
`;

                return `## Generated Test Template

**File:** \`${filePath}\`

Use the \`create\` tool to save this file, then customize with feature-specific tests.

\`\`\`typescript
${template}\`\`\`

**Next steps:**
1. Create the file: \`${filePath}\`
2. Add feature-specific interaction tests
3. Run: \`playwright_run\` with \`file: "${fileName.replace(".spec.ts", "")}"\``;
            },
        },
    ],
});

await session.log("🎭 Playwright testing extension loaded");
