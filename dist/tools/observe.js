import { z } from "zod";
/**
 * Stagehand Observe
 * Docs: https://docs.stagehand.dev/basics/observe
 *
 * This tool is used to observe and identify specific interactive elements on a web page.
 * You can optionally choose to have the observe tool return an action to perform on the element.
 */
const ObserveInputSchema = z.object({
    instruction: z.string().describe(`Detailed instruction for what specific elements or components to observe on the web page.
        This instruction must be extremely specific and descriptive. For example: 'Find the red login button
        in the top right corner', 'Locate the search input field with placeholder text', or 'Identify all
        clickable product cards on the page'. The more specific and detailed your instruction, the better
        the observation results will be. Avoid generic instructions like 'find buttons' or 'see elements'.
        Instead, describe the visual characteristics, location, text content, or functionality of the elements
        you want to observe. This tool is designed to help you identify interactive elements that you can
        later use with the act tool for performing actions like clicking, typing, or form submission.`),
});
const observeSchema = {
    name: "browserbase_stagehand_observe",
    description: `Find interactive elements on the page from an instruction; optionally return an action.`,
    inputSchema: ObserveInputSchema,
};
async function handleObserve(context, params) {
    const action = async () => {
        try {
            const stagehand = await context.getStagehand();
            const observations = await stagehand.observe(params.instruction);
            return {
                content: [
                    {
                        type: "text",
                        text: `Observations: ${JSON.stringify(observations)}`,
                    },
                ],
            };
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to observe: ${errorMsg}`);
        }
    };
    return {
        action,
        waitForNetwork: false,
    };
}
const observeTool = {
    capability: "core",
    schema: observeSchema,
    handle: handleObserve,
};
export default observeTool;
