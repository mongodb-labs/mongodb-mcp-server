# Atlas MCP Server PoC

- Uses the official MCP SDK https://github.com/modelcontextprotocol/typescript-sdk 

## Table of Contents
- [Setting up your environment](#setting-up-your-environment)
- [Running the MCP Server](#running-the-mcp-server)
- [Troubleshooting (Via VSCode Insiders)](#troubleshooting-via-vscode-insiders)
  - [Restart server](#restart-server)
  - [Logs](#logs)
- [Supported tools](#supported-tools)
  - [VSCode](#vscode)
  - [Claude](#claude)


## Setting up your environment

```shell
npm install
```

## Running the MCP Server

```shell
npm run build
```

## Troubleshooting (Via VSCode Insiders)

### Restart server
- Run `npm run build` to re-build the server if you made changes to the code
- Press `Cmd + Shift + P` and type List MCP Servers
- Select the MCP server you want to restart
- Select the option to restart the server

### Logs
To see MCP logs, check https://code.visualstudio.com/docs/copilot/chat/mcp-servers.

- Press `Cmd + Shift + P` and type List MCP Servers
- Select the MCP server you want to see logs for
- Select the option to view logs in the output panel

## Supported tools

### VSCode

Prerequisites: 
- Use VSCode Insiders (https://code.visualstudio.com/insiders/)
- Setup copilot in VSCode Insiders

Step  1: Add the mcp server to VSCode configuration

- Press `Cmd + Shift + P` and type `MCP: Add MCP Server` and select it.
- Select the first option for a local MCP server.
- Add the path to dist/index.js in the prompt

Step 2: Verify the created mcp file

It should look like this 
```shell
{
    "servers": {
        "demo-atlas-server": {
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
```
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Paste the mcp server configuration into the file
```
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