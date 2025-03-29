#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from 'path';
import { fileURLToPath } from 'url';

import { PLAN_TOOL, TRACK_TOOL, UPDATE_STATUS_TOOL } from "./tools/index.js";
import { taskPlanningGuide } from "./prompts.js";
import logger, { LogLevel } from './utils/logger.js';
import { WorkPlan, WorkPlanInitOptions } from './aggregates/workplan.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logLevel = process.env.LOG_LEVEL 
  ? (LogLevel[process.env.LOG_LEVEL as keyof typeof LogLevel] || LogLevel.INFO) 
  : LogLevel.INFO;
logger.setLogLevel(logLevel);
logger.info(`Logger initialized with level: ${LogLevel[logLevel]}`);

const dataDir = process.env.DATA_DIR || path.resolve(__dirname, '../visualization/public/data');
const dataFileName = process.env.DATA_FILE_NAME || 'workplan.json';

const workPlanOptions: WorkPlanInitOptions = {
  dataDir,
  dataFileName
};

export const workPlan = new WorkPlan();
const initSuccess = workPlan.initialize(workPlanOptions);

if (!initSuccess) {
  logger.error(`Failed to initialize WorkPlan with options: ${JSON.stringify(workPlanOptions)}`);
  process.exit(1);
}

const server = new McpServer({
  name: "micromanage",
  version: "0.1.0",
  description: `
  Externalizing developers' working memory and procedures related to work plans for resolving tickets.
  Because it would involve unnecessary overhead, we **do not apply it to tiny tasks**.
  
  This server helps organize and track development tasks through a structured approach with the following key features:
- Breaking down the tasks of the current ticket into minimal PRs and commits
- Tracking progress of implementation work
- Updating status of development items as work progresses

## When to Use This
- When users request ticket assignment
- When users ask for detailed task management
- For complex tasks requiring structured breakdown and tracking

Best practices:
1. Start with the task-planning-guide prompt before creating a plan
2. Keep PRs minimal and focused on single logical changes
3. Make commits small and atomic
4. Update status promptly as work begins or completes
5. Check progress regularly to maintain workflow efficiency
6. Always check the agentInstruction field in the response JSON from the 'track' tool
`,
  capabilities: {
    tools: {
      listChanged: true
    },
    prompts: {
      listChanged: true
    }
  }
});

server.prompt(
  taskPlanningGuide.name,
  taskPlanningGuide.description,
  {}, 
  taskPlanningGuide.handler
);

[PLAN_TOOL, TRACK_TOOL, UPDATE_STATUS_TOOL].forEach(tool => {
  server.tool(tool.name, tool.description ?? "", tool.schema, tool.handler);
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

process.on('SIGINT', () => {
  workPlan.forceSave();
  process.exit(0);
});

process.on('SIGTERM', () => {
  workPlan.forceSave();
  process.exit(0);
});

runServer().catch((error) => {
  logger.logError("Fatal error running server", error);
  workPlan.forceSave();
  process.exit(1);
}); 