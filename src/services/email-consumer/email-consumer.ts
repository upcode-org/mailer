import { Db, Collection } from 'mongodb';
import { MailOptions } from 'nodemailer/lib/stream-transport';
import { Transporter } from 'nodemailer';
import { Connection, Channel, Message } from 'amqplib';
import { rabbitConnection, rabbitChannel } from '../../connections/rabbitMQ';
import { IEmailConsumer, UserVerificationPayload } from './email-consumer-contracts';

export class EmailConsumer implements IEmailConsumer {

    q = 'emails-to-send';
    identityProviderHost = 'https://aip.upcode-api.co'; // dev vs prod
    
    ch: Channel;
    connection: Connection;
    waiting: Array<Message> = [];
    transporter: Transporter;
    mailerDb: Db;
    templatesCollection: Collection;

    constructor(mailerDb: Db, transporter) {
        this.mailerDb = mailerDb;
        this.templatesCollection = mailerDb.collection('templates');
        this.transporter = transporter;

        this.transporter.on('idle', () => {
            console.log('transporter can now send');
            this.flushWaitingMessages();
        });
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

    async onMessage(msg: Message): Promise<boolean|string> {
        console.log('GOT A MESSAGE FROM RMQ');
        if (msg !== null) {
            const outbound = await this.createOutboundMsg(msg);
            if(outbound) this.waiting.push(msg);
            return this.flushWaitingMessages();
        }
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

    async createOutboundMsg(msg): Promise<MailOptions> {
        
        const jsonMsg = JSON.parse(msg.content.toString());
        const msgTypeId = jsonMsg.msgTypeId;

        //1. retrieve template from DB based on msgTypeId
        //2. populate message using jsonMsg.payload
        //3. msg structire should be { msgTypeId: 1, payload: {...} }
        
        const template = await this.templatesCollection.findOne({msgTypeId});
        let PayloadConstructor;

        switch (msgTypeId) {
            case '1':
                PayloadConstructor = UserVerificationPayload;
                break;
            case '2':
                PayloadConstructor = 'WelcomeMessagePayload';
                break;
        }

        try {
            var payload = new PayloadConstructor(msg);
        } catch(err) {
            console.log('rejected malformed msg');
            if (this.ch) this.ch.reject(msg, false);
            return null;
        }
        
        const generatedHtml = this.generateHtml(template, payload);

        const outbound: MailOptions = {
            from: 'admin@upcode.co',
            replyTo: 'mailer@upcode.co',
            to: payload.email,
            subject: 'Verify your upcode account',
            html: generatedHtml
        };
        return outbound;
    }

    generateHtml(template, payload): string {
        function convertVars(msg){
            var regex = /({{\w+}})/g;  //select all words that are in {{ ... }}
            var result = msg.replace(regex, function(match) { 
                return t.payload[match.substring(2, match.length - 2)] ;
            }); 
            return result;
        }
        return 'html'
    }

}

