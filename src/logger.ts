// TODO: use a proper logger here
export function log(level: string, message: string) {
    console.error(`[${level.toUpperCase()}] ${message}`);
}
