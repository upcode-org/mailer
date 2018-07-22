import { Logger } from "winston";
import { Channel } from "amqplib";

export class MonitoringService { 
    
    logger: Logger;
    ch: Channel;

    constructor(logger: Logger, monServCh: Channel) {
        this.logger = logger;
        this.ch = monServCh;
    }

    log(msg, processInstanceId?) {
        if(process.env.TEST) return;
        if(!processInstanceId) processInstanceId = process.pid;

        const queueName = this.getQueueName(processInstanceId);
        this.report(`${processInstanceId}: ${msg}`, queueName );
        this.logger.info(`${processInstanceId}: ${msg} \n`);
    }

    private async report(msg, queueName): Promise<boolean> {
        
        const msgBuffer = new Buffer(JSON.stringify(msg));

        try {
            return this.ch.sendToQueue(queueName, msgBuffer);
        } catch(err) {
            this.log(err && err.message ? err.message : 'Error sending to Rabbit Queue', process.pid);
        }
    }

    private getQueueName(processInstanceId: string | number) {
        switch (processInstanceId) {
            case '001':
                return 'app-identity-provider-process-logs';
            case process.pid:
                return 'mailer-logs';
        }
    }
}