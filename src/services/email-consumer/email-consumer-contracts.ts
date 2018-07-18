import { Message } from "amqplib";

export interface IEmailConsumer {
    connect(): Promise<void>;
    init(): void;
    onMessage(msg: Message): Promise<boolean|string>;
    flushWaitingMessages(): Promise<boolean|string>;
}

export class UserVerificationPayload {
    
    userId: string;
    email: string;
    firstName: string;
    lastName: string;

    constructor(msg: Message) {
        let jsonMsg = JSON.parse(msg.content.toString());
        if(!jsonMsg.userId || !jsonMsg.email || !jsonMsg.firstName || !jsonMsg.lastName) throw new Error('Message from queue has missing fields!');
        this.userId = jsonMsg.userId || null;
        this.email = jsonMsg.email || null;
        this.firstName = jsonMsg.firstName || null;
        this.lastName = jsonMsg.lastName || null;
    }
}

// List other email payload types here.... eg: Booking success email...