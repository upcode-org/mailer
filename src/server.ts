import { containerResolver } from "./composition-root";
import { VerificationEmailConsumer } from './services/verification-email-consumer';

containerResolver()
    .then( async (container) => {
        
        const verificationEmailConsumer: VerificationEmailConsumer = container.get('verificationEmailConsumer');

        await verificationEmailConsumer.connect();

        console.log('ready to send emails...');
        
    })
    .catch( err => console.log('unable to start server', err ));