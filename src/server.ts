import { containerResolver } from "./composition-root";
import { EmailConsumer } from './services/email-consumer/email-consumer';
import { MonitoringService } from './services/monitoring-service';

containerResolver()
    .then( async (container) => {
        
        const monitoringService: MonitoringService = container.get('monitoringService');
        const emailConsumer: EmailConsumer = container.get('emailConsumer');

        await emailConsumer.listen();

        monitoringService.log('ready to send emails...');
        
        process.on('uncaughtException', (err) => {
            monitoringService.log(`Uncaught exception: ${err}`);
            process.exit(1);
        });
        
    })
    .catch( err => console.log('unable to start server', err ));