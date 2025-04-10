# Testing the Atlas MCP Server

This directory contains tests for the Atlas MCP Server. We use Jest as our testing framework along with TypeScript.

## Running Tests

You can run tests using the following npm scripts:

- `npm test`: Run all tests
- `npm run test:watch`: Run tests in watch mode (rerun on file changes)
- `npm run test:coverage`: Run tests and generate coverage reports

To run a specific test file or directory:

```bash
npm test -- path/to/test/file.test.ts
npm test -- path/to/directory
```
