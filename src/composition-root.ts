//       ___           ___                                     ___           ___     
//      /__/\         /  /\        ___                        /  /\         /  /\    
//     |  |::\       /  /::\      /  /\                      /  /:/_       /  /::\   
//     |  |:|:\     /  /:/\:\    /  /:/      ___     ___    /  /:/ /\     /  /:/\:\  
//   __|__|:|\:\   /  /:/~/::\  /__/::\     /__/\   /  /\  /  /:/ /:/_   /  /:/~/:/  
//  /__/::::| \:\ /__/:/ /:/\:\ \__\/\:\__  \  \:\ /  /:/ /__/:/ /:/ /\ /__/:/ /:/___
//  \  \:\~~\__\/ \  \:\/:/__\/    \  \:\/\  \  \:\  /:/  \  \:\/:/ /:/ \  \:\/:::::/
//   \  \:\        \  \::/          \__\::/   \  \:\/:/    \  \::/ /:/   \  \::/~~~~ 
//    \  \:\        \  \:\          /__/:/     \  \::/      \  \:\/:/     \  \:\     
//     \  \:\        \  \:\         \__\/       \__\/        \  \::/       \  \:\    
//      \__\/         \__\/                                   \__\/         \__\/    

import { AppContainer } from './lib/container';
export const container = new AppContainer();

//*******************************************************************/
//Connection dependecies 
import { mongoConnection } from './connections/database';
import { rabbitConnection, rabbitChannel } from './connections/rabbitMQ';
//*******************************************************************/

//*******************************************************************/
//Monitoring dependecy 
import { MonitoringService } from './services/monitoring-service';
import { logger } from './services/logger';
//*******************************************************************/

//*******************************************************************/
//Application Dependencies 
import { EmailConsumer } from './services/email-consumer/email-consumer';
import { transporter } from './services/transporter';
//*******************************************************************/


export const containerResolver = async (): Promise<AppContainer> => {
    try {
        const mailerDb = await mongoConnection();
        const rmqConnection = await rabbitConnection();
        const emailConsumerCh = await rabbitChannel(rmqConnection);
        const monServCh = await rabbitChannel(rmqConnection);
        
        container.singleton('mailerDb', mailerDb );
        container.singleton('emailConsumerCh', emailConsumerCh );
        container.singleton('monServCh', monServCh );
        container.singleton('transporter', transporter);
        container.singleton('logger', logger);
        container.singleton('monitoringService', MonitoringService, ['logger', 'monServCh']); // TO DO... copy from aip
        container.singleton('emailConsumer', EmailConsumer, ['mailerDb', 'transporter', 'emailConsumerCh', 'monitoringService']);
        return container;

    } catch(err) {
        throw err
    }
}
