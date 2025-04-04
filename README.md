# Atlas MCP Server PoC

## Setting up your environment

```shell
npm install
```

## Running the MCP Server

```shell
npm run build
```

## Supported tools

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