import { ArchivingService } from './archiving-service';
import { IVerificationEmailConsumer, UserVerificationPayload } from './service-contracts/verification-email-consumer-contracts';
import { Db } from 'mongodb';
import { UnableToSendMail } from './service-contracts/error-definitions';
import { MailOptions } from 'nodemailer/lib/stream-transport';
import { Transporter } from 'nodemailer';
import { Connection, Channel, Message } from 'amqplib';
import { rabbitConnection, rabbitChannel } from '../data/rabbitMQ';

export class VerificationEmailConsumer implements IVerificationEmailConsumer {

    q = 'verification-emails';
    identityProviderHost = 'localhost:3088'; // dev vs prod
    
    ch: Channel;
    connection: Connection;
    waiting: Array<Message> = [];
    transporter: Transporter;
    mailerDb: Db;
    archivingService: ArchivingService;

    constructor(mailerDb, archivingService, transporter) {
        this.mailerDb = mailerDb;
        this.archivingService = archivingService;
        this.transporter = transporter;

        this.transporter.on('idle', this.flushWaitingMessagesCaller.bind(this));
    }

    async connect(): Promise<void> {
        try {
            this.connection = await rabbitConnection();
            this.ch = await rabbitChannel(this.connection);
            await this.ch.checkQueue(this.q);
            console.log('connected to RabbitMQ');
        } catch(err) {
            console.log('could not connect to RabbitMQ');
            throw err;
        }
        this.connection.on('close', this.connect.bind(this));
        this.init();
    }

    init(): void {
        this.ch.prefetch(10);

        try {
            this.ch.consume(this.q, this.onMessage.bind(this));
            console.log('consuming from ' + this.q + ' queue' );
        } catch(err) { 
            console.log('consumer error: ', err);
        }
    }

    onMessage(msg: Message): Promise<boolean|string> {
        console.log('GOT A MESSAGE FROM RMQ');
        if (msg !== null) {
            this.waiting.push(msg);
            return this.flushWaitingMessages();
        }
    }

    flushWaitingMessagesCaller(): void {
        console.log('Transporter can send!');
        this.flushWaitingMessages();
    }

    flushWaitingMessages(): Promise<boolean|string> {

        const send = (msg: Message): Promise<boolean|string> => {
            let userVerificationPayload;

            try {
                userVerificationPayload = new UserVerificationPayload(msg);
            } catch(err) {
                console.log('rejected malformed msg');
                if (this.ch) this.ch.reject(msg, false);
                return Promise.resolve(false);
            }

            var mailOptions: MailOptions = {
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
                .then( info => {
                    console.log('==+++=====+SENT+=====+++==', info.response );
                    if(this.ch) this.ch.ack(msg);
                    return info.response;
                })
                .catch( err => {
                    setTimeout(() => {
                        console.log('could not send message, rejected to avoid infinite loop', err);
                        if(this.ch) this.ch.reject(msg, false);
                    }, 1000);
                    console.log(err);
                    return false;
                });
        };

        if(this.transporter.isIdle() === false) {
            console.log('Transporter cannot send!');
            return Promise.resolve(false);
        }

        while (this.transporter.isIdle() && this.waiting.length) {
            console.log('sending 1 of', this.waiting.length);
            return send(this.waiting.shift());
        }
    }
    
    sendUserVerification(userVerificationPayload: UserVerificationPayload): Promise<boolean> {
  
        var mailOptions: MailOptions = {
        from: 'no-reply@upcode.co',
        to: userVerificationPayload.email,
        subject: 'Verify your upcode account',
        html: `
            <h1>HELLO ${userVerificationPayload.firstName}</h1>
            <p>Click <a href="http://${this.identityProviderHost}/v1.0/verify?id=${userVerificationPayload.userId}">here</a> to verify your account.</p>
        `
        };

        return this.transporter.sendMail(mailOptions)
        .then( info => {
            if(info.accepted[0]) {
                this.archiveEvent(info.accepted[0], 'sentVerificationEmail');
                return true;
            }
        })
        .catch( err => {
            throw new UnableToSendMail(err.message);
        });
    }

    private archiveEvent(eventPayload: string, eventName: string): void {
        let event = { eventPayload, eventName };
        this.archivingService.archiveEvent(event);
    }

}

