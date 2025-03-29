# mcp-micromanage

Control your coding agent colleague who tends to go off track

![image](https://github.com/user-attachments/assets/d3e060a1-77a1-4a86-bd91-e0917cf405ba)

## Motivation

### Challenges with Coding Agents
- Coding agents often make modifications beyond what they're asked to do
    - Assuming cusor+claude
- They struggle to request user feedback at key decision points during implementation
- Work plans and progress tracking can be challenging to visualize and monitor

### Solution
- **Commit and PR-based Work Plans**: Force implementation plans that break down tickets into PRs and commits as the minimum units of work
- **Forced Frequent Feedback**: Enforce user reviews at the commit level, creating natural checkpoints for feedback
- **Visualization**: Instantly understand the current work plan and implementation status through a local React app

## tool

1. **Plan**: Define your implementation plan with PRs and commits
2. **Track**: Monitor progress and current status of all work items
3. **Update**: Change status as work progresses, with mandatory user reviews

## Visualization Dashboard

The project includes a React-based visualization tool that provides:

- Hierarchical view of PRs and commits
- Status-based color coding
- Zoom and pan capabilities
- Real-time updates with auto-refresh
- Dark/light mode support
- Filtering options for complex work plans

## Getting Started

### Headless

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### Running the Server

```bash
# Start the MCP server
npx @yodakeisuke/mcp-micromanage
```

### Viewing the Dashboard

The visualization dashboard can be accessed by opening:
```
visualization/index.html
```
in your browser.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Third-Party Software

This project uses the following third-party software:

- **MCP TypeScript SDK**: Licensed under the MIT License. Copyright © 2023-2025 Anthropic, PBC.

## Acknowledgments

- Built with [MCP (Model Context Protocol)](https://github.com/modelcontextprotocol/typescript-sdk)
- Maintained by [yodakeisuke](https://github.com/yodakeisuke)
