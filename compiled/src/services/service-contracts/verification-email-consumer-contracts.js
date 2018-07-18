"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UserVerificationPayload {
    constructor(msg) {
        let jsonMsg = JSON.parse(msg.content.toString());
        if (!jsonMsg.userId || !jsonMsg.email || !jsonMsg.firstName || !jsonMsg.lastName)
            throw new Error('Message from queue has missing fields!');
        this.userId = jsonMsg.userId || null;
        this.email = jsonMsg.email || null;
        this.firstName = jsonMsg.firstName || null;
        this.lastName = jsonMsg.lastName || null;
    }
}
exports.UserVerificationPayload = UserVerificationPayload;
//# sourceMappingURL=verification-email-consumer-contracts.js.map