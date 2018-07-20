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
const rabbitMQ_1 = require("../../connections/rabbitMQ");
class EmailConsumer {
    constructor(mailerDb, transporter) {
        this.q = 'emails-to-send';
        this.waiting = [];
        this.mailerDb = mailerDb;
        this.templatesCollection = mailerDb.collection('templates');
        this.transporter = transporter;
        this.transporter.on('idle', () => {
            console.log('transporter can now send');
            this.flushWaitingMessages();
        });
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.connection = yield rabbitMQ_1.rabbitConnection();
                this.ch = yield rabbitMQ_1.rabbitChannel(this.connection);
                yield this.ch.checkQueue(this.q);
                console.log('connected to RabbitMQ');
            }
            catch (err) {
                console.log('could not connect to RabbitMQ');
                throw err;
            }
            this.connection.on('close', this.connect.bind(this));
            this.init();
        });
    }
    init() {
        this.ch.prefetch(10);
        try {
            this.ch.consume(this.q, this.onMessage.bind(this));
            console.log('consuming from ' + this.q + ' queue');
        }
        catch (err) {
            console.log('consumer error: ', err);
        }
    }
    onMessage(msg) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('GOT A MESSAGE FROM RMQ');
            if (msg !== null) {
                const outboundMsg = yield this.createOutboundMsg(msg);
                if (outboundMsg)
                    this.waiting.push(outboundMsg);
                return this.flushWaitingMessages();
            }
        });
    }
    flushWaitingMessages() {
        const send = (outboundMsg) => {
            return this.transporter.sendMail(outboundMsg.outboundMsg)
                .then(info => {
                console.log('==+++=====+SENT+=====+++==', info.response);
                if (this.ch)
                    this.ch.ack(outboundMsg.msg);
                return info.response;
            })
                .catch(err => {
                setTimeout(() => {
                    console.log('could not send message, rejected to avoid infinite loop', err);
                    if (this.ch)
                        this.ch.reject(outboundMsg.msg, false);
                }, 1000);
                console.log(err);
                return false;
            });
        };
        if (this.transporter.isIdle() === false) {
            console.log('Transporter cannot send!');
            return Promise.resolve(false);
        }
        while (this.transporter.isIdle() && this.waiting.length) {
            console.log('sending 1 of', this.waiting.length);
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
            console.log(jsonMsg.recipientEmail);
            const outbound = {
                from: 'admin@upcode.co',
                replyTo: 'mailer@upcode.co',
                to: jsonMsg.recipientEmail,
                subject: templateDoc.subject,
                html: generatedHtml
            };
            return {
                msg: msg,
                outboundMsg: outbound
            };
        });
    }
    generateHtml(template, payload) {
        var regex = /({{\w+}})/g; //select all words that are in {{ ... }}
        var result = template.replace(regex, function (match) {
            return payload[match.substring(2, match.length - 2)];
        });
        console.log(result);
        return result;
    }
}
exports.EmailConsumer = EmailConsumer;
//# sourceMappingURL=email-consumer.js.map