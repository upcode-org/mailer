"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class MonitoringService {
    constructor(logger, monServCh) {
        this.logger = logger;
        this.ch = monServCh;
    }
    log(msg, processInstanceId) {
        if (process.env.TEST)
            return;
        if (!processInstanceId)
            processInstanceId = process.pid;
        const queueName = this.getQueueName(processInstanceId);
        this.report(`${processInstanceId}: ${msg}`, queueName);
        this.logger.info(`${processInstanceId}: ${msg} \n`);
    }
    report(msg, queueName) {
        return __awaiter(this, void 0, void 0, function* () {
            const msgBuffer = new Buffer(JSON.stringify(msg));
            try {
                return this.ch.sendToQueue(queueName, msgBuffer);
            }
            catch (err) {
                this.log(err && err.message ? err.message : 'Error sending to Rabbit Queue', process.pid);
            }
        });
    }
    getQueueName(processInstanceId) {
        switch (processInstanceId) {
            case '001':
                return 'app-identity-provider-process-logs';
            case process.pid:
                return 'mailer-logs';
        }
    }
}
exports.MonitoringService = MonitoringService;
//# sourceMappingURL=monitoring-service.js.map