import { containerResolver } from "./composition-root";
import { VerificationMailer } from './services/verification-mailer';

containerResolver()
    .then((container) => {
        const verificationMailer: VerificationMailer = container.get('verificationMailer');
        verificationMailer.init();
    })
    .catch( err => console.log('unable to start server', err ));