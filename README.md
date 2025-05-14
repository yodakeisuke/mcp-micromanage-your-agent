[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/yodakeisuke-mcp-micromanage-your-agent-badge.png)](https://mseep.ai/app/yodakeisuke-mcp-micromanage-your-agent)

[![npm](https://img.shields.io/npm/v/@yodakeisuke/mcp-micromanage)](https://www.npmjs.com/package/@yodakeisuke/mcp-micromanage)

# mcp-micromanage

Control your coding agent colleague who tends to go off track.

If [sequentialthinking](https://github.com/modelcontextprotocol/servers/tree/main/src/sequentialthinking) is a dynamic formulation and externalization of thought workflows, this tool is a dynamic formulation and externalization of development task flows.


![image](https://github.com/user-attachments/assets/d3e060a1-77a1-4a86-bd91-e0917cf405ba)

## Motivation

### Challenges with Coding Agents
- Coding agents often make modifications beyond what they're asked to do
    - Assuming cursor+claude
- They struggle to request user feedback at key decision points during implementation
- Work plans and progress tracking can be challenging to visualize and monitor
  
### Solution
- **Commit and PR-based Work Plans**: Force implementation plans that break down tickets into PRs and commits as the minimum units of work
- **Forced Frequent Feedback**: Enforce user reviews at the commit level, creating natural checkpoints for feedback
- **Visualization**: Instantly understand the current work plan and implementation status through a local React app

## tool

1. **plan**: Define your implementation plan with PRs and commits
2. **track**: Monitor progress and current status of all work items
3. **update**: Change status as work progresses, with mandatory user reviews

## Visualization Dashboard

The project includes a React-based visualization tool that provides:

- Hierarchical view of PRs and commits
- Real-time updates with auto-refresh
- Status-based color coding
- Zoom and pan capabilities

## Getting Started

### Headless（mcp tool only）

1. Add to your mcp json
```json
{
  "mcpServers": {
    "micromanage": {
      "command": "npx",
      "args": [
        "-y",
        "@yodakeisuke/mcp-micromanage"
      ]
    }
  }
}
```

2. (Highly recommended) Add the following `.mdc`s to your project

[recommended-rules](https://github.com/yodakeisuke/mcp-micromanage-your-agent/tree/main/.cursor/rules)

(Can be adjusted to your preference)

### With Visualisation

1. clone this repository

2. Add to your mcp json
```json
{
  "mcpServers": {
    "micromanage": {
      "command": "node",
      "args": [
        "[CLONE_DESTINATION_PATH]/sequentialdeveloping/dist/index.js"
      ]
    }
  }
}
```

3. build server
```bash
npm install
npm run build
```

4. run frontend
```bash
cd visualization/ 
npm install
npm run dev
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Third-Party Software

This project uses the following third-party software:

- **MCP TypeScript SDK**: Licensed under the MIT License. Copyright © 2023-2025 Anthropic, PBC.

## Acknowledgments

- Built with [MCP (Model Context Protocol)](https://github.com/modelcontextprotocol/typescript-sdk)
- Maintained by [yodakeisuke](https://github.com/yodakeisuke)
