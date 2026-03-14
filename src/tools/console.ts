import { z } from "zod";
import type { Tool, ToolSchema, ToolResult } from "./tool.js";
import type { Context } from "../context.js";
import type { ToolActionResult } from "../types/types.js";

/**
 * Console Logs Tool
 *
 * Captures and retrieves browser console logs (errors, warnings, etc.)
 * from the Playwright page underlying Stagehand.
 */

interface ConsoleEntry {
  type: string;
  text: string;
  timestamp: number;
}

// Per-session console log storage
const sessionLogs = new Map<string, ConsoleEntry[]>();
const attachedPages = new WeakSet<object>();

function ensureConsoleListener(page: any, sessionId: string): void {
  if (attachedPages.has(page)) return;
  attachedPages.add(page);

  if (!sessionLogs.has(sessionId)) {
    sessionLogs.set(sessionId, []);
  }

  const logs = sessionLogs.get(sessionId)!;

  page.on("console", (msg: any) => {
    logs.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: Date.now(),
    });
  });

  page.on("pageerror", (error: any) => {
    logs.push({
      type: "error",
      text: `[PageError] ${error.message || String(error)}`,
      timestamp: Date.now(),
    });
  });
}

// --- Tool: Get Console Logs ---
const ConsoleLogsInputSchema = z.object({
  type: z
    .enum(["all", "error", "warning", "log", "info", "debug"])
    .optional()
    .describe("Filter by log type. Default: 'all'"),
  clear: z
    .boolean()
    .optional()
    .describe("Clear logs after retrieval. Default: false"),
});

type ConsoleLogsInput = z.infer<typeof ConsoleLogsInputSchema>;

const consoleLogsSchema: ToolSchema<typeof ConsoleLogsInputSchema> = {
  name: "browserbase_console_logs",
  description:
    "Retrieve console logs from the browser with filtering options. Captures errors, warnings, and other console output.",
  inputSchema: ConsoleLogsInputSchema,
};

async function handleConsoleLogs(
  context: Context,
  params: ConsoleLogsInput,
): Promise<ToolResult> {
  const action = async (): Promise<ToolActionResult> => {
    try {
      const stagehand = await context.getStagehand();
      const page = stagehand.context.pages()[0];
      if (!page) {
        throw new Error("No active page available");
      }

      const sessionId = context.currentSessionId;
      ensureConsoleListener(page, sessionId);

      const allLogs = sessionLogs.get(sessionId) || [];
      const filterType = params.type || "all";

      const filtered =
        filterType === "all"
          ? allLogs
          : allLogs.filter((l) => l.type === filterType);

      const result = filtered.map((l) => `[${l.type}] ${l.text}`).join("\n");

      if (params.clear) {
        sessionLogs.set(sessionId, []);
      }

      return {
        content: [
          {
            type: "text",
            text:
              filtered.length === 0
                ? `No console ${filterType === "all" ? "" : filterType + " "}logs captured.`
                : `Console logs (${filtered.length} entries):\n${result}`,
          },
        ],
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to get console logs: ${errorMsg}`);
    }
  };

  return {
    action,
    waitForNetwork: false,
  };
}

const consoleLogsTool: Tool<typeof ConsoleLogsInputSchema> = {
  capability: "core",
  schema: consoleLogsSchema,
  handle: handleConsoleLogs,
};

export { ensureConsoleListener };
export default consoleLogsTool;
