import { Message } from "amqplib";
import { MailOptions } from 'nodemailer/lib/stream-transport';

export interface IEmailConsumer {
    onMessage(msg: Message): Promise<boolean | string>;
    listen(): void;
}

export interface OutboundMsg {
    msg: Message;
    processInstanceId: string;
    outboundMsg: MailOptions;
}

export interface EmailMsg {
    msgTypeId: number;
    recipientEmail: string;
    processInstanceId: string;
    payload: any;
}
