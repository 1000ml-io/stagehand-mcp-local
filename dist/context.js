import { listResources, readResource } from "./mcp/resources.js";
import { SessionManager } from "./sessionManager.js";
/**
 * MCP Server Context
 *
 * Central controller that connects the MCP server infrastructure with browser automation capabilities,
 * managing server instances, browser sessions, tool execution, and resource access.
 */
export class Context {
    config;
    server;
    sessionManager;
    // currentSessionId is a getter that delegates to SessionManager to ensure synchronization
    // This prevents desync between Context and SessionManager session tracking
    get currentSessionId() {
        return this.sessionManager.getActiveSessionId();
    }
    constructor(server, config, contextId) {
        this.server = server;
        this.config = config;
        this.sessionManager = new SessionManager(contextId);
    }
    getServer() {
        return this.server;
    }
    getSessionManager() {
        return this.sessionManager;
    }
    /**
     * Gets the Stagehand instance for the current session from SessionManager
     */
    async getStagehand(sessionId = this.currentSessionId) {
        const session = await this.sessionManager.getSession(sessionId, this.config);
        if (!session) {
            throw new Error(`No session found for ID: ${sessionId}`);
        }
        return session.stagehand;
    }
    async run(tool, args) {
        try {
            console.error(`Executing tool: ${tool.schema.name} with args: ${JSON.stringify(args)}`);
            // Check if this tool has a handle method (new tool system)
            if ("handle" in tool && typeof tool.handle === "function") {
                const toolResult = await tool.handle(this, args);
                if (toolResult?.action) {
                    const actionResult = await toolResult.action();
                    const content = actionResult?.content || [];
                    return {
                        content: Array.isArray(content)
                            ? content
                            : [{ type: "text", text: "Action completed successfully." }],
                        isError: false,
                    };
                }
                else {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `${tool.schema.name} completed successfully.`,
                            },
                        ],
                        isError: false,
                    };
                }
            }
            else {
                // Fallback for any legacy tools without handle method
                throw new Error(`Tool ${tool.schema.name} does not have a handle method`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Tool ${tool.schema?.name || "unknown"} failed: ${errorMessage}`);
            return {
                content: [{ type: "text", text: `Error: ${errorMessage}` }],
                isError: true,
            };
        }
    }
    /**
     * List resources
     * Documentation: https://modelcontextprotocol.io/docs/concepts/resources
     */
    listResources() {
        return listResources();
    }
    /**
     * Read a resource by URI
     * Documentation: https://modelcontextprotocol.io/docs/concepts/resources
     */
    readResource(uri) {
        return readResource(uri);
    }
}
