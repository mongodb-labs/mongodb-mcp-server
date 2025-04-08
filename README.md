# Atlas MCP Server

A Model Context Protocol server for interacting with MongoDB Atlas. This project implements a Model Context Protocol (MCP) server enabling AI assistants to interact with MongoDB Atlas resources through natural language.

## 📚 Table of Contents

- [🚀 Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the MCP Server](#running-the-mcp-server)
- [🛠️ Supported Tools](#supported-tools)
  - [Tool List](#tool-list)
- [👩‍💻 Client Integration](#client-integration)
  - [VSCode](#vscode)
  - [Claude](#claude)
- [🤝 Contributing](#contributing)

## 🚀 Getting Started

### Prerequisites

- Node.js (v23 or later)
- MongoDB Atlas account

### Installation

```shell
# Clone the repository
git clone https://github.com/mongodb-labs/mongodb-mcp-server.git
cd mongodb-mcp-server

# Install dependencies
npm install
```

### Running the MCP Server

```shell
npm run build
```

## 🛠️ Supported Tools

### Tool List

- `auth` - Authenticate to MongoDB Atlas
- `list-clusters` - Lists MongoDB Atlas clusters
- `list-projects` - Lists MongoDB Atlas projects

## 👩‍💻 Client Integration (Use the server!)

### VSCode

Prerequisites:

- Use VSCode Insiders (https://code.visualstudio.com/insiders/)
- Setup copilot in VSCode Insiders

Step 1: Add the mcp server to VSCode configuration

- Press `Cmd + Shift + P` and type `MCP: Add MCP Server` and select it.
- Select the first option for a local MCP server.
- Add the path to dist/index.js in the prompt

Step 2: Verify the created mcp file

It should look like this

```json
{
  "servers": {
    "mongodb-mcp-server": {
      "type": "stdio",
      "command": "/Users/<user>/workplace/atlas-mcp-server/dist/index.js",
      "args": []
    }
  }
}
```

Step 3: Open the copilot chat and check that the toolbox icon is visible and has the mcp server listed.

Step 4: Try running a command

- Can you list my clusters?

### Claude

Step 1: Install claude and login

```shell
brew install claude
```

Step 2: Create a configuration file for your MCP server

Open the file

```shell
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Paste the mcp server configuration into the file

```json
{
  "mcpServers": {
    "Demo": {
      "command": "path/to/this/repo/atlas-mc-server/dist/index.js"
    }
  }
}
```

Step 3: Launch Claude Desktop and click on the hammer icon, the Demo MCP server should be detected. Type in the chat "show me a demo of MCP" and allow the tool to get access.

- Detailed instructions with screenshots can be found in this [document](https://docs.google.com/document/d/1_C8QBMZ5rwImV_9v4G96661OqcBk1n1SfEgKyNalv9c/edit?tab=t.2hhewstzj7ck#bookmark=id.nktw0lg0fn7t).

Note: If you make changes to your MCP server code, rebuild the project with `npm run build` and restart the server and Claude Desktop.

## 🤝 Contributing

Interested in contributing? Great! Please check our [Contributing Guide](CONTRIBUTING.md) for guidelines on code contributions, standards, adding new tools, and troubleshooting information.
