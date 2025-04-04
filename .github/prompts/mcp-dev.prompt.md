You will use all your knowledge to implement the Atlas MCP server.
To understand how to develop the MCP server, you also need some context about Atlas.

1. https://github.com/mongodb/atlas-sdk-go is an auto-generated Atlas Golang SDK
2. https://github.com/mongodb/openapi is a great open source of truth to the Atlas Admin API, https://github.com/mongodb/openapi/blob/main/openapi/v2/openapi-2025-03-12.yaml contains the latest available API documentation.
3. https://github.com/mongodb/mongodb-atlas-cli is a great open source of truth for how to autogenerate code from the OpenAPI spec.
4. https://github.com/mongodb/mongodb-atlas-cli/tree/master/internal/cli/authis a great open source of truth for how to implement authentication.