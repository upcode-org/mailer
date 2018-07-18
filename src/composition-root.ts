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
//*******************************************************************/

//*******************************************************************/
//Monitoring dependecy 
import { MonitoringService } from './services/monitoring-service';
//*******************************************************************/

//*******************************************************************/
//Application Dependencies 
import { EmailConsumer } from './services/email-consumer/email-consumer';
import { transporter } from './services/transporter';
//*******************************************************************/


export const containerResolver = async (): Promise<AppContainer> => {
    try {
        const mailerDb = await mongoConnection();
        container.singleton('mailerDb', mailerDb );
        container.singleton('transporter', transporter);
        container.singleton('emailConsumer', EmailConsumer, ['mailerDb', 'transporter']);
        container.singleton('monitoringService', MonitoringService); // TO DO... copy from aip
        return container;

    } catch(err) {
        throw err
    }
}
