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
//import { ArchivingService } from './archiving-service';
const verification_email_consumer_contracts_1 = require("./service-contracts/verification-email-consumer-contracts");
const error_definitions_1 = require("./service-contracts/error-definitions");
const rabbitMQ_1 = require("../data/rabbitMQ");
class VerificationEmailConsumer {
    constructor(mailerDb, transporter) {
        this.q = 'app-signup-verification-emails';
        this.identityProviderHost = 'localhost:3088'; // dev vs prod
        this.waiting = [];
        this.mailerDb = mailerDb;
        this.transporter = transporter;
        this.transporter.on('idle', this.flushWaitingMessagesCaller.bind(this));
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
        console.log('GOT A MESSAGE FROM RMQ');
        if (msg !== null) {
            this.waiting.push(msg);
            return this.flushWaitingMessages();
        }
    }
    flushWaitingMessagesCaller() {
        console.log('Transporter can send!');
        this.flushWaitingMessages();
    }
    flushWaitingMessages() {
        const send = (msg) => {
            let userVerificationPayload;
            try {
                userVerificationPayload = new verification_email_consumer_contracts_1.UserVerificationPayload(msg);
            }
            catch (err) {
                console.log('rejected malformed msg');
                if (this.ch)
                    this.ch.reject(msg, false);
                return Promise.resolve(false);
            }
            var mailOptions = {
                from: 'admin@upcode.co',
                replyTo: 'mailer@upcode.co',
                to: userVerificationPayload.email,
                subject: 'Verify your upcode account',
                html: `
                    <h1>HELLO ${userVerificationPayload.firstName}</h1>
                    <p>Click <a href="http://${this.identityProviderHost}/v1.0/verify?id=${userVerificationPayload.userId}">here</a> to verify your account.</p>
                `
            };
            return this.transporter.sendMail(mailOptions)
                .then(info => {
                console.log('==+++=====+SENT+=====+++==', info.response);
                if (this.ch)
                    this.ch.ack(msg);
                return info.response;
            })
                .catch(err => {
                setTimeout(() => {
                    console.log('could not send message, rejected to avoid infinite loop', err);
                    if (this.ch)
                        this.ch.reject(msg, false);
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
    sendUserVerification(userVerificationPayload) {
        var mailOptions = {
            from: 'no-reply@upcode.co',
            to: userVerificationPayload.email,
            subject: 'Verify your upcode account',
            html: `
            <h1>HELLO ${userVerificationPayload.firstName}</h1>
            <p>Click <a href="http://${this.identityProviderHost}/v1.0/verify?id=${userVerificationPayload.userId}">here</a> to verify your account.</p>
        `
        };
        return this.transporter.sendMail(mailOptions)
            .then(info => {
            if (info.accepted[0]) {
                return true;
            }
        })
            .catch(err => {
            throw new error_definitions_1.UnableToSendMail(err.message);
        });
    }
}
exports.VerificationEmailConsumer = VerificationEmailConsumer;
//# sourceMappingURL=verification-email-consumer.js.map