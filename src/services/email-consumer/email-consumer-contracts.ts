import { Message } from "amqplib";
import { MailOptions } from 'nodemailer/lib/stream-transport';

export interface IEmailConsumer {
    connect(): Promise<void>;
    init(): void;
    onMessage(msg: Message): Promise<boolean|string>;
    flushWaitingMessages(): Promise<boolean|string>;
}

export interface OutboundMsg {
    msg: Message;
    outboundMsg: MailOptions
}


