import { Db, Collection } from 'mongodb';
import { MailOptions } from 'nodemailer/lib/stream-transport';
import { Transporter } from 'nodemailer';
import { Channel, Message } from 'amqplib';
import { IEmailConsumer, OutboundMsg, EmailMsg } from './email-consumer-contracts';
import { MonitoringService } from '../monitoring-service';

export class EmailConsumer implements IEmailConsumer {

    q = 'emails-to-send';
    ch: Channel;
    waiting: Array<OutboundMsg> = [];
    transporter: Transporter;
    mailerDb: Db;
    templatesCollection: Collection;
    monitoringService:MonitoringService;

    constructor(mailerDb, transporter, emailConsumerCh, monitoringService) {
        this.mailerDb = mailerDb;
        this.templatesCollection = mailerDb.collection('templates');
        this.transporter = transporter;
        this.ch = emailConsumerCh;
        this.monitoringService = monitoringService;

        this.transporter.on('idle', () => {
            this.monitoringService.log('Transporter is available to send')
            this.flushWaitingMessages();
        });
    }

    async listen(): Promise<void> {
        
        this.ch.prefetch(10);

        try {
            this.ch.consume(this.q, this.onMessage.bind(this));
            this.monitoringService.log('consuming from ' + this.q + ' queue');
        } catch(err) { 
            this.monitoringService.log(`Email consumer error: ${err}`);
        }
    }

    async onMessage(msg: Message): Promise<boolean|string> {
        this.monitoringService.log('Received msg from RMQ');
        if (msg !== null) {
            const outboundMsg: OutboundMsg = await this.createOutboundMsg(msg);
            if(outboundMsg) this.waiting.push(outboundMsg);
            this.monitoringService.log(`added outbound message to internal email queue: ${outboundMsg.outboundMsg.html}`, outboundMsg.processInstanceId);
            return this.flushWaitingMessages();
        }
    }

    private flushWaitingMessages(): Promise<boolean|string> {

        const send = (outboundMsg: OutboundMsg): Promise<boolean|string> => {

            return this.transporter.sendMail(outboundMsg.outboundMsg)
                .then( info => {
                    if(this.ch) this.ch.ack(outboundMsg.msg);
                    this.monitoringService.log(`Sent email success`, outboundMsg.processInstanceId);
                    return info.response;
                })
                .catch( err => {
                    setTimeout(() => {
                        if(this.ch) this.ch.reject(outboundMsg.msg, false);
                        this.monitoringService.log(`Rejected email with error: ${err}`, outboundMsg.processInstanceId);
                    }, 1000);
                    return false;
                });
        };

        if(this.transporter.isIdle() === false) {
            this.monitoringService.log('Transporter cannot send!')
            return Promise.resolve(false);
        }

        while (this.transporter.isIdle() && this.waiting.length) {
            this.monitoringService.log(`sending 1 of ${this.waiting.length}`);
            return send(this.waiting.shift());
        }
    }

    private async createOutboundMsg(msg): Promise<OutboundMsg> {
        
        const jsonMsg: EmailMsg = JSON.parse(msg.content.toString());
        const msgTypeId = jsonMsg.msgTypeId;

        try {
            var templateDoc = await this.templatesCollection.findOne({msgTypeId});
        } catch(err){
            // report err
            return null;
        }

        const generatedHtml = this.generateHtml(templateDoc.html, jsonMsg.payload);
        const outbound: MailOptions = {
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
    }

    private generateHtml(template, payload): string {
        var regex = /({{\w+}})/g;  //select all words that are in {{ ... }}
        var result = template.replace(regex, function(match) { 
            return payload[match.substring(2, match.length - 2)] ;
        }); 
        return result;
    }

}

