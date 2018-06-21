import { expect } from 'chai';
import 'mocha';
import { containerResolver } from '../composition-root';
import { VerificationMailer } from './verification-mailer';
import { UserVerificationPayload } from './service-contracts/verification-mailer-contracts';
import { Message } from 'amqplib';

describe('Verification Mailer Test:', function() {
    this.timeout(15000);
    let container;

    before( async () => {
        container = await containerResolver();
    });

    it('should send a verification email', async () => {
        const verificationMailer: VerificationMailer = container.get('verificationMailer');
        
        const msg: any = { content : new Buffer('{"userId":"5b29160a9373381d14bcdb74","email":"svegalopez@gmail.com","firstName":"Sebastian","lastName":"Vega"}') };
        let userVerificationPayload;
        let result;

        try {
            userVerificationPayload = new UserVerificationPayload(msg);
            result = await verificationMailer.sendUserVerification(userVerificationPayload);
        } catch(err) {
            result = err;
        }

        expect(result).to.satisfy((result) => {
            if(result instanceof Error) return false;
            return true;
        });
    });

    after(() => {
        const verificationMailer: VerificationMailer = container.get('verificationMailer');
        verificationMailer.transporter.close();
    });

});


