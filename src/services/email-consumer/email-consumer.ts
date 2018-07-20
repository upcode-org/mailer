import { Db, Collection } from 'mongodb';
import { MailOptions } from 'nodemailer/lib/stream-transport';
import { Transporter } from 'nodemailer';
import { Connection, Channel, Message } from 'amqplib';
import { rabbitConnection, rabbitChannel } from '../../connections/rabbitMQ';
import { IEmailConsumer, OutboundMsg } from './email-consumer-contracts';

export class EmailConsumer implements IEmailConsumer {

    q = 'emails-to-send';
    ch: Channel;
    connection: Connection;
    waiting: Array<OutboundMsg> = [];
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
            const outboundMsg = await this.createOutboundMsg(msg);
            if(outboundMsg) this.waiting.push(outboundMsg);
            return this.flushWaitingMessages();
        }
    }

    flushWaitingMessages(): Promise<boolean|string> {

        const send = (outboundMsg: OutboundMsg): Promise<boolean|string> => {

            return this.transporter.sendMail(outboundMsg.outboundMsg)
                .then( info => {
                    console.log('==+++=====+SENT+=====+++==', info.response );
                    if(this.ch) this.ch.ack(outboundMsg.msg);
                    return info.response;
                })
                .catch( err => {
                    setTimeout(() => {
                        console.log('could not send message, rejected to avoid infinite loop', err);
                        if(this.ch) this.ch.reject(outboundMsg.msg, false);
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

    async createOutboundMsg(msg): Promise<OutboundMsg> {
        
        const jsonMsg = JSON.parse(msg.content.toString());
        const msgTypeId = jsonMsg.msgTypeId;

        try {
            var templateDoc = await this.templatesCollection.findOne({msgTypeId});
        } catch(err){
            // report err
            return null;
        }

        const generatedHtml = this.generateHtml(templateDoc.html, jsonMsg.payload);
        console.log(jsonMsg.recipientEmail);
        const outbound: MailOptions = {
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
    }

    generateHtml(template, payload): string {
        var regex = /({{\w+}})/g;  //select all words that are in {{ ... }}
        var result = template.replace(regex, function(match) { 
            return payload[match.substring(2, match.length - 2)] ;
        }); 
        console.log(result)
        return result;
    }

}

