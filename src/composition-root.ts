import { AppContainer } from '../lib/container';
export const container = new AppContainer();

//*******************************************************************/
//Data dependecies 
import { mongoConnection } from './data/database';
import { rabbitConnection } from './data/rabbitMQ';
//*******************************************************************/

//*******************************************************************/
//Monitoring dependecy 
import { MonitoringService } from './services/monitoring-service';
//*******************************************************************/

//*******************************************************************/
//Application Dependencies 
import { ArchivingService } from './services/archiving-service';
import { VerificationMailer } from './services/verification-mailer';
import { transporter } from './services/transporter';
//*******************************************************************/


export const containerResolver = async (): Promise<AppContainer> => {
    try {
        const mailerDb = await mongoConnection();
        const connection = await rabbitConnection();
        container.singleton('mailerDb', mailerDb );
        container.singleton('connection', connection );
        container.singleton('transporter', transporter);
        container.singleton('verificationMailer', VerificationMailer, ['mailerDb', 'archivingService', 'transporter', 'connection']);
        container.singleton('monitoringService', MonitoringService);
        container.singleton('archivingService', ArchivingService , ['mailerDb']);
        return container;

    } catch(err) {
        throw err
    }
}
