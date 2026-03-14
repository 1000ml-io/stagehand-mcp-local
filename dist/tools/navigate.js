import { z } from "zod";
import { captureScreenshot, formatScreenshotMarker } from "../utils/screenshot.js";
const NavigateInputSchema = z.object({
    url: z.string().describe("The URL to navigate to"),
});
const navigateSchema = {
    name: "browserbase_stagehand_navigate",
    description: `Navigate to a URL in the browser. Only use this tool with URLs you're confident will work and be up to date.
    Otherwise, use https://google.com as the starting point`,
    inputSchema: NavigateInputSchema,
};
async function handleNavigate(context, params) {
    const action = async () => {
        try {
            const stagehand = await context.getStagehand();
            const isLocalMode = context.config.env === "LOCAL";
            const pages = stagehand.context.pages();
            const page = pages[0];
            if (!page) {
                throw new Error("No active page available");
            }
            await page.goto(params.url, { waitUntil: "domcontentloaded" });
            // In LOCAL mode, we don't need browserbaseSessionId
            if (!isLocalMode) {
                const sessionId = stagehand.browserbaseSessionId;
                if (!sessionId) {
                    throw new Error("No Browserbase session ID available");
                }
            }
            // Capture screenshot after navigation
            const screenshotPath = await captureScreenshot(page, `navigate: ${params.url}`, context.config.screenshot);
            const screenshotMarker = formatScreenshotMarker(screenshotPath);
            return {
                content: [
                    {
                        type: "text",
                        text: `Navigated to: ${params.url}${screenshotMarker}`,
                    },
                ],
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to navigate: ${errorMsg}`);
        }
    };
    return {
        action,
        waitForNetwork: false,
    };
}
const navigateTool = {
    capability: "core",
    schema: navigateSchema,
    handle: handleNavigate,
};
export default navigateTool;
