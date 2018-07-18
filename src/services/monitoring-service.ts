import { Logger } from "winston";
import { Connection, Channel } from "amqplib";

export class MonitoringService { 
    
    logger: Logger;
    connection: Connection;
    ch: Channel;

    constructor(logger: Logger, rmqConnection, rmqChannel) {
        this.logger = logger;
        this.connection = rmqConnection;
        this.ch = rmqChannel;
    }

    log(msg, processInstanceId) {
        if(!process.env.TEST) {
            const queueName = this.getQueueName(processInstanceId);
            this.report(`${processInstanceId}: ${msg}`, queueName );
            this.logger.info(`${processInstanceId}: ${msg} \n`);
        }
    }

    async report(msg, queueName): Promise<boolean> {

        const msgBuffer = new Buffer(JSON.stringify(msg));

        try {
            return this.ch.sendToQueue(queueName, msgBuffer);
        } catch(err) {
            this.log(err && err.message ? err.message : 'Error sending to Rabbit Queue', process.pid);
        }
    }

    getQueueName(processInstanceId: string) {
        switch (processInstanceId) {
            case '001':
                return 'app-identity-provider-process-logs';
            case (process.pid.toString()):
                return 'mailer-logs';
        }
    }
}