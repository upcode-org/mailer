"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston = require("winston");
exports.logger = winston.createLogger({
    format: winston.format.prettyPrint(),
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ]
});
if (process.env.NODE_ENV !== 'production') {
    exports.logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}
//# sourceMappingURL=logger.js.map