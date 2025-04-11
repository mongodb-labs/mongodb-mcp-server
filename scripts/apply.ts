import fs from "fs/promises";
import { OpenAPIV3_1 } from "openapi-types";
import argv from "yargs-parser";

function findParamFromRef(ref: string, openapi: OpenAPIV3_1.Document): OpenAPIV3_1.ParameterObject {
    const paramParts = ref.split("/");
    paramParts.shift(); // Remove the first part which is always '#'
    let param: any = openapi; // eslint-disable-line @typescript-eslint/no-explicit-any
    while (true) {
        const part = paramParts.shift();
        if (!part) {
            break;
        }
        param = param[part];
    }
    return param;
}

async function main() {
    const { spec, file } = argv(process.argv.slice(2));

    if (!spec || !file) {
        console.error("Please provide both --spec and --file arguments.");
        process.exit(1);
    }

    const specFile = (await fs.readFile(spec, "utf8")) as string;

    const operations: {
        path: string;
        method: string;
        operationId: string;
        requiredParams: boolean;
        tag: string;
    }[] = [];

    const openapi = JSON.parse(specFile) as OpenAPIV3_1.Document;
    for (const path in openapi.paths) {
        for (const method in openapi.paths[path]) {
            const operation: OpenAPIV3_1.OperationObject = openapi.paths[path][method];

            if (!operation.operationId || !operation.tags?.length) {
                continue;
            }

            let requiredParams = !!operation.requestBody;

            for (const param of operation.parameters || []) {
                const ref = (param as OpenAPIV3_1.ReferenceObject).$ref as string | undefined;
                let paramObject: OpenAPIV3_1.ParameterObject = param as OpenAPIV3_1.ParameterObject;
                if (ref) {
                    paramObject = findParamFromRef(ref, openapi);
                }
                if (paramObject.in === "path") {
                    requiredParams = true;
                }
            }

            operations.push({
                path,
                method: method.toUpperCase(),
                operationId: operation.operationId || "",
                requiredParams,
                tag: operation.tags[0],
            });
        }
    }

    const operationOutput = operations
        .map((operation) => {
            const { operationId, method, path, requiredParams } = operation;
            return `async ${operationId}(options${requiredParams ? "" : "?"}: FetchOptions<operations["${operationId}"]>) {
    const { data } = await this.client.${method}("${path}", options);
    return data;
}
`;
        })
        .join("\n");

    const templateFile = (await fs.readFile(file, "utf8")) as string;
    const output = templateFile.replace(
        /\/\/ DO NOT EDIT\. This is auto-generated code\.\n.*\/\/ DO NOT EDIT\. This is auto-generated code\./g,
        operationOutput
    );

    await fs.writeFile(file, output, "utf8");
}

main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});
