"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UnableToSendMail extends Error {
    constructor(message) {
        super(message);
        this.code = 1;
    }
}
exports.UnableToSendMail = UnableToSendMail;
class MissingFields extends Error {
    constructor(message) {
        super(message);
        this.code = 2;
    }
}
exports.MissingFields = MissingFields;
//# sourceMappingURL=error-definitions.js.map