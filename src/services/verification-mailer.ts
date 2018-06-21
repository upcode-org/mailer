import { ArchivingService } from './archiving-service';
import { IVerificationMailer, UserVerificationPayload } from './service-contracts/verification-mailer-contracts';
import { Db } from 'mongodb';
import { UnableToSendMail } from './service-contracts/error-definitions';
import { MailOptions } from 'nodemailer/lib/stream-transport';
import { Transporter } from 'nodemailer';
import { Connection, Channel, Message } from 'amqplib';

export class VerificationMailer implements IVerificationMailer {

    q = 'verification-emails';
    identityProviderHost = 'localhost:3088'; // dev vs prod
    
    ch: Channel;
    connection: Connection;
    waiting: Array<Message> = [];
    transporter: Transporter;
    mailerDb: Db;
    archivingService: ArchivingService;

    constructor(mailerDb, archivingService, transporter, connection) {
        this.mailerDb = mailerDb;
        this.archivingService = archivingService;
        this.transporter = transporter;
        this.connection = connection;
    }

    async init(): Promise<void> {
        this.ch = await this.connection.createChannel();
        await this.ch.assertQueue(this.q);
        this.ch.prefetch(10);
        this.ch.consume(this.q, this.onMessage.bind(this));
        this.transporter.on('idle', this.flushWaitingMessagesCaller.bind(this));
    }

    onMessage(msg: Message) {
        console.log('FROM RMQ')
        if (msg !== null) {
            this.waiting.push(msg);
            return this.flushWaitingMessages();
        }
        return null;
    }

    flushWaitingMessagesCaller(){
        console.log('on idle called me!');
        this.flushWaitingMessages();
    }

    flushWaitingMessages() {

        const send = (msg: Message): void => {
            let userVerificationPayload;

            try {
                userVerificationPayload = new UserVerificationPayload(msg);
            } catch(err) {
                //report err
                //console.log('reject malformed msg');
                return this.ch.reject(msg, false);
            }

            var mailOptions: MailOptions = {
                from: 'no-reply@upcode.co',
                to: userVerificationPayload.email,
                subject: 'Verify your upcode account',
                html: `
                    <h1>HELLO ${userVerificationPayload.firstName}</h1>
                    <p>Click <a href="http://${this.identityProviderHost}/v1.0/verify?id=${userVerificationPayload.userId}">here</a> to verify your account.</p>
                `
            };

            this.transporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                    setTimeout(() => {
                        //console.log('could not send message, rejected to avoid infinite loop');
                        this.ch.reject(msg, false);
                    }, 1000);
                    return;
                }
                //console.log('==+++=====+++++=====+++==');
                //console.log('Message delivered ', info.response);
                //console.log(this.waiting.length);
                //console.log('==+++=====+++++=====+++==');
                this.ch.ack(msg);
            });

            return null;
        };

        if(this.transporter.isIdle() === false) console.log('NOT IDLE');

        while (this.transporter.isIdle() && this.waiting.length) {
            console.log('internal queue size: ', this.waiting.length);
            send(this.waiting.shift());
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

