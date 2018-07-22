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
class EmailConsumer {
    constructor(mailerDb, transporter, emailConsumerCh, monitoringService) {
        this.q = 'emails-to-send';
        this.waiting = [];
        this.mailerDb = mailerDb;
        this.templatesCollection = mailerDb.collection('templates');
        this.transporter = transporter;
        this.ch = emailConsumerCh;
        this.monitoringService = monitoringService;
        this.transporter.on('idle', () => {
            this.monitoringService.log('Transporter is available to send');
            this.flushWaitingMessages();
        });
    }
    listen() {
        return __awaiter(this, void 0, void 0, function* () {
            this.ch.prefetch(10);
            try {
                this.ch.consume(this.q, this.onMessage.bind(this));
                this.monitoringService.log('consuming from ' + this.q + ' queue');
            }
            catch (err) {
                this.monitoringService.log(`Email consumer error: ${err}`);
            }
        });
    }
    onMessage(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            this.monitoringService.log('Received msg from RMQ');
            if (msg !== null) {
                const outboundMsg = yield this.createOutboundMsg(msg);
                if (outboundMsg)
                    this.waiting.push(outboundMsg);
                this.monitoringService.log(`added outbound message to internal email queue: ${outboundMsg.outboundMsg.html}`, outboundMsg.processInstanceId);
                return this.flushWaitingMessages();
            }
        });
    }
    flushWaitingMessages() {
        const send = (outboundMsg) => {
            return this.transporter.sendMail(outboundMsg.outboundMsg)
                .then(info => {
                if (this.ch)
                    this.ch.ack(outboundMsg.msg);
                this.monitoringService.log(`Sent email success`, outboundMsg.processInstanceId);
                return info.response;
            })
                .catch(err => {
                setTimeout(() => {
                    if (this.ch)
                        this.ch.reject(outboundMsg.msg, false);
                    this.monitoringService.log(`Rejected email with error: ${err}`, outboundMsg.processInstanceId);
                }, 1000);
                return false;
            });
        };
        if (this.transporter.isIdle() === false) {
            this.monitoringService.log('Transporter cannot send!');
            return Promise.resolve(false);
        }
        while (this.transporter.isIdle() && this.waiting.length) {
            this.monitoringService.log(`sending 1 of ${this.waiting.length}`);
            return send(this.waiting.shift());
        }
    }
    createOutboundMsg(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            const jsonMsg = JSON.parse(msg.content.toString());
            const msgTypeId = jsonMsg.msgTypeId;
            try {
                var templateDoc = yield this.templatesCollection.findOne({ msgTypeId });
            }
            catch (err) {
                // report err
                return null;
            }
            const generatedHtml = this.generateHtml(templateDoc.html, jsonMsg.payload);
            const outbound = {
                from: 'admin@upcode.co',
                replyTo: 'mailer@upcode.co',
                to: jsonMsg.recipientEmail,
                subject: templateDoc.subject,
                html: generatedHtml
            };
            return {
                msg: msg,
                processInstanceId: jsonMsg.processInstanceId,
                outboundMsg: outbound
            };
        });
    }
    generateHtml(template, payload) {
        var regex = /({{\w+}})/g; //select all words that are in {{ ... }}
        var result = template.replace(regex, function (match) {
            return payload[match.substring(2, match.length - 2)];
        });
        return result;
    }
}
exports.EmailConsumer = EmailConsumer;
//# sourceMappingURL=email-consumer.js.map