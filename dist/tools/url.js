import { z } from "zod";
/**
 * Stagehand Get URL
 *
 * This tool is used to get the current URL of the browser page.
 */
// Empty schema since getting URL doesn't require any input
const GetUrlInputSchema = z.object({});
const getUrlSchema = {
    name: "browserbase_stagehand_get_url",
    description: "Return the current page URL (full URL with query/fragment).",
    inputSchema: GetUrlInputSchema,
};
async function handleGetUrl(context, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
params) {
    const action = async () => {
        try {
            const stagehand = await context.getStagehand();
            const page = stagehand.context.pages()[0];
            if (!page) {
                throw new Error("No active page available");
            }
            const currentUrl = page.url();
            return {
                content: [
                    {
                        type: "text",
                        text: currentUrl,
                    },
                ],
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to get current URL: ${errorMsg}`);
        }
    };
    return {
        action,
        waitForNetwork: false,
    };
}
const getUrlTool = {
    capability: "core",
    schema: getUrlSchema,
    handle: handleGetUrl,
};
export default getUrlTool;
