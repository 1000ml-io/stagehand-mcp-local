import { z } from "zod";
import { captureScreenshot, formatScreenshotMarker } from "../utils/screenshot.js";
/**
 * Stagehand Act
 * Docs: https://docs.stagehand.dev/basics/act
 *
 * This tool is used to perform actions on a web page.
 */
const ActInputSchema = z.object({
    action: z.string().describe(`The action to perform. Should be as atomic and specific as possible,
      i.e. 'Click the sign in button' or 'Type 'hello' into the search input'.`),
    variables: z
        .object({})
        .optional()
        .describe(`Variables used in the action template. ONLY use variables if you're dealing
      with sensitive data or dynamic content. When using variables, you MUST have the variable
      key in the action template. ie: {"action": "Fill in the password", "variables": {"password": "123456"}}`),
});
const actSchema = {
    name: "browserbase_stagehand_act",
    description: `Perform a single action on the page (e.g., click, type).`,
    inputSchema: ActInputSchema,
};
async function handleAct(context, params) {
    const action = async () => {
        try {
            const stagehand = await context.getStagehand();
            await stagehand.act(params.action, {
                variables: params.variables,
            });
            // Capture screenshot after action (for LOCAL mode visualization)
            const page = stagehand.context.pages()[0];
            const screenshotPath = page
                ? await captureScreenshot(page, `act: ${params.action}`, context.config.screenshot)
                : null;
            const screenshotMarker = formatScreenshotMarker(screenshotPath);
            return {
                content: [
                    {
                        type: "text",
                        text: `Action performed: ${params.action}${screenshotMarker}`,
                    },
                ],
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to perform action: ${errorMsg}`);
        }
    };
    return {
        action,
        waitForNetwork: false,
    };
}
const actTool = {
    capability: "core",
    schema: actSchema,
    handle: handleAct,
};
export default actTool;
