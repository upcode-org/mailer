import { expect } from 'chai';
import 'mocha';
import { containerResolver } from '../composition-root';
import { EmailConsumer } from './email-consumer';

describe('Verification Mailer Test:', function() {
    this.timeout(15000);
    let container;

    before( async () => {
        container = await containerResolver();
    });

    it('should send a verification email', async () => {
        const emailConsumer: EmailConsumer = container.get('emailConsumer');
        
        const msg: any = { content : new Buffer('{"userId":"5b29160a9373381d14bcdb74","email":"svegalopez@gmail.com","firstName":"Sebastian","lastName":"Vega"}') };
        let result;

        try {
            result = await emailConsumer.onMessage(msg);
        } catch(err) {
            result = err;
        }

        expect(result).to.satisfy((result) => {
            console.log('RESULT: ', result.substring(0,3) );
            if(result && result.substring(0,3) === '250') return true;
            return false;
        });
    });

    after(() => {
        const emailConsumer: EmailConsumer = container.get('emailConsumer');
        emailConsumer.transporter.close();
    });

});


