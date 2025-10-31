require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');
const {
    spawn
} = require('child_process');

const anthropic = new Anthropic(); // API key is read from ANTHROPIC_API_KEY env var

const AGENT_DEFINITIONS_PATH = path.join(__dirname, '..', '.claude', 'agents');
const MCP_SETTINGS_PATH = path.join(__dirname, '..', '.claude', 'settings.json');
const MAX_ITERATIONS = 25;

// Global variable to hold the MCP tool definitions
let mcpTools = null;

/**
 * Spawns and connects to all MCP servers defined in settings.json
 * and extracts their tool definitions.
 */
async function initializeMCPServers() {
    console.log('Initializing MCP Servers...');
    const settingsRaw = await fs.readFile(MCP_SETTINGS_PATH, 'utf-8');
    const settings = JSON.parse(settingsRaw.replace(/\${workspaceFolder}/g, path.join(__dirname, '..')));

    const toolPromises = Object.entries(settings.mcpServers).map(([name, config]) => {
        return new Promise((resolve, reject) => {
            console.log(`- Starting ${name} MCP server...`);
            const serverProcess = spawn(config.command, config.args, {
                env: { ...process.env,
                    ...config.env
                },
                shell: true
            });

            serverProcess.stderr.on('data', (data) => {
                console.error(`[MCP Server Error - ${name}]: ${data.toString()}`);
            });
            
            // Simple request to list tools
            const listToolsRequest = {
                jsonrpc: "2.0",
                method: "list_tools",
                id: `list-${name}-${Date.now()}`
            };

            serverProcess.stdout.on('data', (data) => {
                 try {
                    const response = JSON.parse(data.toString());
                    if (response.result && response.result.tools) {
                        console.log(`- ${name} MCP server connected, ${response.result.tools.length} tools loaded.`);
                        resolve(response.result.tools);
                        serverProcess.kill(); // We don't need it running for now
                    }
                } catch (e) {
                   // Ignore parsing errors as it might be startup messages
                }
            });
            
             setTimeout(() => {
                serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
            }, 2000); // Wait a bit for the server to initialize
        });
    });

    const allToolsNested = await Promise.all(toolPromises);
    mcpTools = allToolsNested.flat();
    console.log(`\n✅ All ${mcpTools.length} MCP tools loaded and ready.\n`);
}

/**
 * Calls the Anthropic API with a specific agent's persona and task.
 */
async function callAgent(agentName, prompt, tools = []) {
    const agentPromptPath = agentName.startsWith('/') ?
        path.join(AGENT_DEFINITIONS_PATH, `${agentName.slice(1)}.md`) :
        path.join(__dirname, '..', '.claude', 'CLAUDE.md');

    const systemPrompt = await fs.readFile(agentPromptPath, 'utf-8');

    const messages = [{
        role: 'user',
        content: prompt
    }];

    const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages,
        tools: tools,
    });

    return response;
}

/**
 * Executes a tool requested by an agent.
 */
async function executeTool(toolName, toolInput) {
    console.log(`\n🔧 Executing tool: ${toolName}`, toolInput);
    // In a real scenario, this would involve IPC with the running MCP servers.
    // For this script, we'll re-use the wordpress-server logic directly for simplicity.
    // This is a simplified simulation of a full MCP client.
    const {
        exec
    } = require('child_process');
    const {
        promisify
    } = require('util');
    const execAsync = promisify(exec);
    const WP_PATH = process.cwd();

    // Simplified tool execution logic.
    try {
        let cmd = '';
        switch (toolName) {
            case 'install_plugin':
                cmd = `wp plugin install ${toolInput.plugin} --activate --path="${WP_PATH}"`;
                break;
            case 'create_page':
                cmd = `wp post create --post_type=page --post_title="${toolInput.title}" --post_status=publish --porcelain --path="${WP_PATH}"`;
                break;
            case 'update_option':
                 cmd = `wp option update ${toolInput.option_name} "${toolInput.option_value}" --path="${WP_PATH}"`;
                 break;
            case 'create_menu':
                await execAsync(`wp menu create "${toolInput.name}" --path="${WP_PATH}"`);
                if(toolInput.pages && toolInput.pages.length > 0) {
                     await execAsync(`wp menu item add-post "${toolInput.name}" $(wp post list --post_type=page --post_name__in=${toolInput.pages.join(',')} --field=ID --format=ids) --path="${WP_PATH}"`);
                }
                if(toolInput.location) {
                    await execAsync(`wp menu location assign "${toolInput.name}" "${toolInput.location}" --path="${WP_PATH}"`);
                }
                return { success: true, output: `Menu '${toolInput.name}' configured.` };

            // Filesystem tools
            case 'writeFile':
                await fs.writeFile(toolInput.path, toolInput.content, 'utf-8');
                return { success: true, message: `File written to ${toolInput.path}`};
            case 'mkdir':
                await fs.mkdir(toolInput.path, { recursive: true });
                return { success: true, message: `Directory created at ${toolInput.path}`};
        }

        const { stdout, stderr } = await execAsync(cmd);
        if (stderr) console.error(`Tool STDERR: ${stderr}`);
        return { success: true, output: stdout.trim() };

    } catch (e) {
        console.error(`Tool execution failed: ${e.message}`);
        return { success: false, error: e.message };
    }
}


/**
 * Main execution loop
 */
async function main() {
    await initializeMCPServers();

    let iteration = 0;
    let lastTaskResult = "No tasks executed yet.";
    const mainPrompt = await fs.readFile('prompt.md', 'utf-8');
    let todoContent = "";
    
    while (iteration < MAX_ITERATIONS) {
        iteration++;
        console.log(`\n\n=============== ORCHESTRATOR - ITERATION ${iteration} ===============\n`);
        
        try {
            todoContent = await fs.readFile('todo.md', 'utf-8');
        } catch (e) {
            console.log("`todo.md` not found. This must be the first run.");
            todoContent = "No `todo.md` file yet. Please create one based on the main prompt.";
        }

        const orchestratorPrompt = `
        **Main Goal:**
        ${mainPrompt}

        **Last Task Result:**
        ${lastTaskResult}
        
        **Current Plan (todo.md):**
        \`\`\`markdown
        ${todoContent}
        \`\`\`

        Based on the above, what is the very next delegation command?
        `;

        const orchestratorResponse = await callAgent('Orchestrator', orchestratorPrompt);
        const orchestratorText = orchestratorResponse.content[0].text;
        console.log(`Orchestrator says: "${orchestratorText}"`);

        // Parse delegation command
        const delegationMatch = orchestratorText.match(/DELEGATE: (\/\w+) TASK: "([^"]+)"/);
        
        if (!delegationMatch) {
            // Check if the orchestrator is trying to write the todo list for the first time
            if (orchestratorText.includes('todo.md')) {
                 await fs.writeFile('todo.md', orchestratorText, 'utf-8');
                 lastTaskResult = "`todo.md` has been created/updated.";
                 console.log("Orchestrator created `todo.md`. Continuing to next iteration.");
                 continue;
            }
            console.log("Orchestrator did not provide a clear DELEGATE command. Ending loop.");
            break;
        }

        const [, agent, task] = delegationMatch;
        console.log(`\n--------------- DELEGATING TO ${agent} ---------------`);
        console.log(`TASK: ${task}`);
        
        let specialistResponse = await callAgent(agent, task, mcpTools);
        let specialistContent = specialistResponse.content;
        let toolResults = [];

        if (specialistResponse.stop_reason === 'tool_use') {
            for (const toolUse of specialistContent.filter(block => block.type === 'tool_use')) {
                const result = await executeTool(toolUse.name, toolUse.input);
                toolResults.push({
                    type: 'tool_result',
                    tool_use_id: toolUse.id,
                    content: JSON.stringify(result),
                });
            }
            
            // Send results back to specialist agent
            const finalResponse = await anthropic.messages.create({
                 model: 'claude-3-sonnet-20240229',
                 max_tokens: 4096,
                 messages: [
                     { role: 'user', content: task },
                     { role: 'assistant', content: specialistContent },
                     { role: 'user', content: toolResults }
                 ],
                 tools: mcpTools,
                 system: await fs.readFile(path.join(AGENT_DEFINITIONS_PATH, `${agent.slice(1)}.md`), 'utf-8')
            });
            lastTaskResult = finalResponse.content[0].text;

        } else {
             lastTaskResult = specialistResponse.content[0].text;
        }
        
        console.log(`\n✅ ${agent} Result: ${lastTaskResult}`);

        // Update todo.md
        const updatedTodo = todoContent.replace(`- [ ] ${task}`, `- [x] ${task}`);
        await fs.writeFile('todo.md', updatedTodo, 'utf-8');
        console.log("`todo.md` updated.");

        if (!updatedTodo.includes('- [ ]')) {
            console.log("\n\n🎉 All tasks completed! Mission accomplished.");
            break;
        }
    }

    if (iteration >= MAX_ITERATIONS) {
        console.log("\n\n⚠️ Max iterations reached. Process stopped.");
    }
}

main().catch(console.error);
