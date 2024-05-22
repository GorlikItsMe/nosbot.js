import winston from "winston";
import util from "util";
import path from "path";
const { combine, timestamp, printf, colorize, align, errors } = winston.format;

const LOG_PATH = process.env.LOG_PATH || "logs";

const consoleFormat = combine(
    colorize({ all: true }),
    timestamp({
        format: "YYYY-MM-DD HH:mm:ss.SSS",
    }),
    align(),
    {
        transform: (info: winston.Logform.TransformableInfo, opts: any) => {
            const args = info[Symbol.for("splat")];
            if (args) {
                info.message = util.format(info.message, ...args);
            }
            if (info.stack) {
                info.message = info.stack;
            }
            return info;
        },
    },
    printf((info) => {
        return `[${info.timestamp}] [${info.moduleName} / ${info.level}]: ${info.message}`;
    })
);

const fileFormat = combine(
    timestamp({
        format: "YYYY-MM-DD HH:mm:ss.SSS",
    }),
    align(),
    {
        transform: (info: winston.Logform.TransformableInfo, opts: any) => {
            const args = info[Symbol.for("splat")];
            if (args) {
                info.message = util.format(info.message, ...args);
            }
            if (info.stack) {
                info.message = info.stack;
            }
            return info;
        },
    },
    printf((info) => {
        return `[${info.timestamp}] [${info.moduleName} / ${info.level}]: ${info.message}`;
    })
);

export function createLogger(moduleName: string): winston.Logger {
    return winston.createLogger({
        level: process.env.LOG_LEVEL || "info",
        defaultMeta: { moduleName: moduleName },
        format: errors({ stack: true }),
        transports: [
            new winston.transports.Console({
                format: consoleFormat,
                handleExceptions: true,
            }),
            new winston.transports.File({
                filename: path.join(LOG_PATH, "combined.log"),
                format: fileFormat,
                handleExceptions: true,
            }),
            new winston.transports.File({
                filename: path.join(LOG_PATH, "error.log"),
                level: "error",
                format: fileFormat,
                handleExceptions: true,
            }),
        ],
    });
}
