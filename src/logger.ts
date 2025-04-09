import { MongoLogId, MongoLogManager, MongoLogWriter } from "mongodb-log-writer";
import path from "path";
import config from "./config.js";
import redact from "mongodb-redact";
import fs from "fs/promises";

let logWriter: MongoLogWriter | undefined = undefined;

export async function initializeLogger(): Promise<void> {
    const logDir = path.join(config.localDataPath, ".app-logs");
    await fs.mkdir(logDir, { recursive: true });

    const manager = new MongoLogManager({
        directory: path.join(config.localDataPath, ".app-logs"),
        retentionDays: 30,
        onwarn: console.warn,
        onerror: console.error,
        gzip: false,
        retentionGB: 1,
    });

    await manager.cleanupOldLogFiles();

    logWriter = await manager.createLogWriter();
}

const log = {
    log(level: "info" | "warn" | "error" | "debug" | "fatal", id: MongoLogId, context: string, message: string): void {
        message = redact(message);
        if (logWriter) {
            logWriter[level]("MONGODB-MCP", id, context, message);
        } else {
            console.error(
                `[${level.toUpperCase()}] Logger not initialized, dropping message: ${message}, context: ${context}, id: ${id}`
            );
        }
    },

    info(id: MongoLogId, context: string, message: string): void {
        this.log("info", id, context, message);
    },

    warn(id: MongoLogId, context: string, message: string): void {
        this.log("warn", id, context, message);
    },
    error(id: MongoLogId, context: string, message: string): void {
        this.log("error", id, context, message);
    },
    debug(id: MongoLogId, context: string, message: string): void {
        this.log("debug", id, context, message);
    },
    fatal(id: MongoLogId, context: string, message: string): void {
        this.log("fatal", id, context, message);
    },
};

export default log;
