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

## Writing Tests

### Basic Test Structure

Each test file should follow this basic structure:

```typescript
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { moduleToTest } from '../path/to/module';

describe('Feature being tested', () => {
  beforeEach(() => {
    // Setup before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should do something specific', () => {
    // Test code
    expect(result).toBe(expectedValue);
  });
});
```

### Mocking

#### Mocking Modules

To mock an imported module:

```typescript
jest.mock('../path/to/module', () => {
  return {
    functionName: jest.fn().mockReturnValue('mocked value'),
    ClassName: jest.fn().mockImplementation(() => ({
      methodName: jest.fn().mockResolvedValue('result'),
    })),
  };
});
```

#### Mocking HTTP Requests

For testing API calls:

```typescript
// Mock fetch or any HTTP client
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ data: 'mock data' }),
  })
);
```

### Testing Async Code

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toEqual(expectedValue);
});

it('should handle rejected promises', async () => {
  await expect(failingAsyncFunction()).rejects.toThrow();
});
```

### Testing MongoDB Tools

When testing MongoDB tools, mock the MongoDB client:

```typescript
jest.mock('mongodb', () => {
  // Create mock implementation of MongoDB client
});
```

### Testing Atlas API Tools

When testing Atlas API tools, mock the authentication and HTTP calls:

```typescript
// Mock authentication
jest.mock('../../src/common/atlas/auth', () => ({
  getAccessToken: jest.fn().mockResolvedValue('mock-token'),
}));

// Mock HTTP responses
global.fetch = jest.fn();
(global.fetch as jest.Mock).mockResolvedValue({
  ok: true,
  json: async () => ({ /* mock response data */ }),
});
```

## Best Practices

1. **Test one thing per test**: Each test should verify one specific behavior
2. **Use descriptive test names**: Test names should describe what is being tested
3. **Mock external dependencies**: Don't rely on external services in unit tests
4. **Clean up after tests**: Reset state after tests to avoid interference
5. **Test edge cases**: Include tests for error conditions and edge cases
6. **Keep tests independent**: Tests should not depend on each other

## ESM and TypeScript Configuration

The project uses ESM modules with TypeScript. The Jest configuration in `jest.config.js` is set up to handle this properly. Make sure you:

1. Use `import` instead of `require`
2. Import from `@jest/globals` for Jest functions
3. Follow the patterns in the template test

For more information on testing patterns and techniques, refer to the [Jest documentation](https://jestjs.io/docs/getting-started).