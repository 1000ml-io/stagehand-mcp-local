import fs from "fs";
import path from "path";

// Use a generic Page type that matches Playwright's Page interface
interface Page {
  screenshot(options?: { path?: string; type?: "jpeg" | "png"; quality?: number }): Promise<Buffer>;
  url(): string;
}

export interface ScreenshotConfig {
  enabled: boolean;
  dir: string;
  sessionId: string;
}

const defaultConfig: ScreenshotConfig = {
  enabled: process.env.SCREENSHOT_ENABLED !== "false",
  dir: process.env.SCREENSHOT_DIR || "/tmp/stagehand-screenshots",
  sessionId: process.env.STAGEHAND_SESSION_ID || "default",
};

/**
 * Capture a screenshot and save it to disk
 * Returns the screenshot path that can be included in the response
 */
export async function captureScreenshot(
  page: Page,
  action: string,
  config: Partial<ScreenshotConfig> = {},
): Promise<string | null> {
  const finalConfig = { ...defaultConfig, ...config };

  if (!finalConfig.enabled) {
    return null;
  }

  try {
    // Ensure screenshot directory exists
    const sessionDir = path.join(finalConfig.dir, finalConfig.sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });

    // Generate filename with timestamp
    const timestamp = Date.now();
    const filename = `${timestamp}.jpg`;
    const filepath = path.join(sessionDir, filename);

    // Take screenshot
    await page.screenshot({
      path: filepath,
      type: "jpeg",
      quality: 80,
    });

    // Write metadata for external consumers
    const metaPath = path.join(sessionDir, "latest.json");
    fs.writeFileSync(
      metaPath,
      JSON.stringify({
        screenshot: filepath,
        action,
        url: page.url(),
        timestamp,
      }),
    );

    process.stderr.write(`[Screenshot] Captured: ${filepath}\n`);
    return filepath;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[Screenshot] Failed to capture: ${errorMsg}\n`);
    return null;
  }
}

/**
 * Format the screenshot path as a marker that can be parsed by external systems
 */
export function formatScreenshotMarker(screenshotPath: string | null): string {
  if (!screenshotPath) {
    return "";
  }
  return `\n[SCREENSHOT:${screenshotPath}]`;
}
