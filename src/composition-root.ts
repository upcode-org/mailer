import { AppContainer } from '../lib/container';
export const container = new AppContainer();

//*******************************************************************/
//Data dependecies 
import { mongoConnection } from './data/database';
//*******************************************************************/

//*******************************************************************/
//Monitoring dependecy 
import { MonitoringService } from './services/monitoring-service';
import { ArchivingService } from './services/archiving-service';
//*******************************************************************/

//*******************************************************************/
//Application Dependencies 
import { VerificationEmailConsumer } from './services/verification-email-consumer';
import { transporter } from './services/transporter';
//*******************************************************************/


export const containerResolver = async (): Promise<AppContainer> => {
    try {
        const mailerDb = await mongoConnection();
        container.singleton('mailerDb', mailerDb );
        container.singleton('transporter', transporter);
        container.singleton('verificationEmailConsumer', VerificationEmailConsumer, ['mailerDb', 'archivingService', 'transporter']);
        container.singleton('monitoringService', MonitoringService);
        container.singleton('archivingService', ArchivingService , ['mailerDb']);
        return container;

    } catch(err) {
        throw err
    }
}
