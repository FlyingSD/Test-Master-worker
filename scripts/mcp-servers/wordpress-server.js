#!/usr/bin/env node
/**
 * WordPress MCP Server
 * Gives Claude direct access to WordPress via WP-CLI
 */
const {
    Server
} = require('@modelcontextprotocol/sdk/server/index.js');
const {
    StdioServerTransport
} = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
    CallToolRequestSchema,
    ListToolsRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');
const {
    exec
} = require('child_process');
const {
    promisify
} = require('util');

const execAsync = promisify(exec);

// WordPress path from environment or default
const WP_PATH = process.env.WP_PATH || process.cwd();

// Tool definitions
const TOOLS = [{
    name: 'wp_cli',
    description: 'Execute WP-CLI commands to manage WordPress. For safety, destructive commands like `db reset` are disabled.',
    inputSchema: {
        type: 'object',
        properties: {
            command: {
                type: 'string',
                description: 'The WP-CLI command to execute (e.g., "plugin list", "post create --post_title=Hello")'
            }
        },
        required: ['command']
    }
}, {
    name: 'create_page',
    description: 'Create a WordPress page with content',
    inputSchema: {
        type: 'object',
        properties: {
            title: {
                type: 'string',
                description: 'Page title'
            },
            content: {
                type: 'string',
                description: 'Page content (HTML or plain text)'
            },
            slug: {
                type: 'string',
                description: 'URL slug'
            },
            status: {
                type: 'string',
                enum: ['publish', 'draft'],
                default: 'publish'
            }
        },
        required: ['title']
    }
}, {
    name: 'install_plugin',
    description: 'Install and activate a WordPress plugin',
    inputSchema: {
        type: 'object',
        properties: {
            plugin: {
                type: 'string',
                description: 'Plugin slug from wordpress.org'
            },
            activate: {
                type: 'boolean',
                default: true
            }
        },
        required: ['plugin']
    }
}, {
    name: 'create_menu',
    description: 'Create a WordPress navigation menu and optionally add pages and assign a location.',
    inputSchema: {
        type: 'object',
        properties: {
            name: {
                type: 'string',
                description: 'Menu name'
            },
            pages: {
                type: 'array',
                items: {
                    type: 'string'
                },
                description: 'Array of page slugs or IDs to add to the menu'
            },
            location: {
                type: 'string',
                description: 'Menu theme location (e.g., "primary")'
            }
        },
        required: ['name']
    }
}, {
    name: 'update_option',
    description: 'Update a WordPress option (e.g., for setting homepage, permalinks, timezone)',
    inputSchema: {
        type: 'object',
        properties: {
            option_name: {
                type: 'string',
                description: 'The name of the option to update.'
            },
            option_value: {
                type: 'string',
                description: 'The new value for the option.'
            }
        },
        required: ['option_name', 'option_value']
    }
}];

// Create MCP server
const server = new Server({
    name: 'wordpress-mcp-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});

// Execute WP-CLI command
async function executeWPCLI(command) {
    // Basic security check to prevent highly destructive commands
    const forbiddenCommands = ['db reset', 'db drop', 'site delete', 'core download'];
    if (forbiddenCommands.some(forbidden => command.includes(forbidden))) {
        return {
            success: false,
            output: null,
            error: `Error: The command "${command}" is disabled for security reasons.`
        };
    }

    try {
        const {
            stdout,
            stderr
        } = await execAsync(`wp ${command} --path="${WP_PATH}"`, {
            cwd: WP_PATH
        });

        if (stderr) {
            // Some WP-CLI commands output progress to stderr, so we don't treat it as a fatal error unless stdout is empty
            if (stdout) {
                 console.warn('WP-CLI stderr:', stderr);
            } else {
                 throw new Error(stderr);
            }
        }

        return {
            success: true,
            output: stdout.trim(),
            error: stderr || null
        };
    } catch (error) {
        return {
            success: false,
            output: null,
            error: error.message
        };
    }
}

// Handle list_tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: TOOLS
    };
});

// Handle call_tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const {
        name,
        arguments: args
    } = request.params;
    console.log(`[WordPress MCP] Received tool call: ${name}`, args);

    try {
        let result;

        switch (name) {
            case 'wp_cli':
                result = await executeWPCLI(args.command);
                break;

            case 'create_page':
                const contentArg = args.content ? `--post_content="${args.content.replace(/"/g, '\\"')}"` : '';
                const cmd = `post create --post_type=page --post_title="${args.title}" ${contentArg} --post_status=${args.status || 'publish'}${args.slug ? ` --post_name="${args.slug}"` : ''} --porcelain`;
                result = await executeWPCLI(cmd);
                break;

            case 'install_plugin':
                const activateFlag = args.activate !== false ? '--activate' : '';
                result = await executeWPCLI(`plugin install ${args.plugin} ${activateFlag}`);
                break;

            case 'create_menu':
                const createMenuCmd = `menu create "${args.name}"`;
                const menuResult = await executeWPCLI(createMenuCmd);

                if (!menuResult.success) {
                    throw new Error(`Failed to create menu: ${menuResult.error}`);
                }

                if (args.pages && args.pages.length > 0) {
                    for (const page of args.pages) {
                         // Find the post ID from the slug
                        const pageIdResult = await executeWPCLI(`post list --post_type=page --name=${page} --field=ID`);
                        if(pageIdResult.success && pageIdResult.output) {
                           await executeWPCLI(`menu item add-post "${args.name}" ${pageIdResult.output}`);
                        } else {
                           console.warn(`Could not find page with slug: ${page}`);
                        }
                    }
                }

                if (args.location) {
                    await executeWPCLI(`menu location assign "${args.name}" ${args.location}`);
                }

                result = { success: true, output: `Menu '${args.name}' created and configured.` };
                break;

            case 'update_option':
                result = await executeWPCLI(`option update ${args.option_name} "${args.option_value}"`);
                break;

            default:
                throw new Error(`Unknown tool: ${name}`);
        }

        console.log(`[WordPress MCP] Tool result:`, result);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result)
            }]
        };

    } catch (error) {
        console.error(`[WordPress MCP] Error executing tool ${name}:`, error);
        return {
            content: [{
                type: 'text',
                text: `Error: ${error.message}`
            }],
            isError: true
        };
    }
});

// Start server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('WordPress MCP Server running on stdio');
}

main().catch(console.error);
