# Contributing to MongoDB MCP Server

Thank you for your interest in contributing to the MongoDB MCP Server project! This document provides guidelines and instructions for contributing.

## Project Overview

This project implements a Model Context Protocol (MCP) server for MongoDB and MongoDB Atlas, enabling AI assistants to interact with MongoDB Atlas resources through natural language.

## Development Setup

### Prerequisites

- Node.js (v23 or later)
- npm

### Getting Started

1. Clone the repository:

   ```
   git clone https://github.com/mongodb-labs/mongodb-mcp-server.git
   cd mongodb-mcp-server
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Add the mcp server to your IDE of choice
   ```json
   {
     "mcpServers": {
       "MongoDB": {
         "command": "/path/to/mongodb-mcp-server/dist/index.js"
       }
     }
   }
   ```

## Code Contribution Workflow

1. Create a new branch for your feature or bugfix:

   ```
   git checkout -b feature/your-feature-name
   ```

2. Make your changes, following the code style of the project

3. Run the inspector and double check your changes:

   ```
   npm run inspect
   ```

4. Commit your changes with a descriptive commit message

## Pull Request Guidelines

1. Update documentation if necessary
2. Ensure your PR includes only relevant changes
3. Link any related issues in your PR description
4. Keep PRs focused on a single topic

## Code Standards

- Use TypeScript for all new code
- Follow the existing code style (indentation, naming conventions, etc.)
- Comment your code when necessary, especially for complex logic
- Use meaningful variable and function names

## Reporting Issues

When reporting issues, please include:

- A clear description of the problem
- Steps to reproduce
- Expected vs. actual behavior
- Version information
- Environment details

## Adding New Tools

When adding new tools to the MCP server:

1. Follow the existing pattern in `server.ts`
2. Define clear parameter schemas using Zod
3. Implement thorough error handling
4. Add proper documentation for the tool
5. Include examples of how to use the tool

## License

By contributing to this project, you agree that your contributions will be licensed under the project's license.

## Questions?

If you have any questions or need help, please open an issue or reach out to the maintainers.
