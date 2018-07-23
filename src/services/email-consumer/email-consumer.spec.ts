import { expect } from 'chai';
import 'mocha';
import { containerResolver } from '../../composition-root';
import { EmailConsumer } from './email-consumer';
import { EmailMsg } from './email-consumer-contracts';

describe('Verification Mailer Test:', function() {
    this.timeout(20000);
    let container;

    before( async () => {
        container = await containerResolver();
    });

    it('should send a verification email', async () => {
        const emailConsumer: EmailConsumer = container.get('emailConsumer');
        
        const emailMsg: EmailMsg = { 
            msgTypeId: 1,
            recipientEmail: 'svegalopez@gmail.com',
            processInstanceId: (process.pid).toString(),
            payload: {
                "APP_IDENTITY_PROVIDER_HOST": 'test-host', 
                "FIRST_NAME": 'Test Name',
                "LAST_NAME": 'Test Surname',
                "USER_ID": '123456', 
            }
        }

        const msg:any = { content: new Buffer(JSON.stringify(emailMsg))}

        let result;

        try {
            result = await emailConsumer.onMessage(msg);
        } catch(err) {
            result = err;
        }

        expect(result).to.satisfy((result) => {
            console.log('RESULT: ', result );
            if(result && result.substring(0,3) === '250') return true;
            return false;
        });
    });

    after(() => {
        const emailConsumer: EmailConsumer = container.get('emailConsumer');
        emailConsumer.transporter.close();
    });

});


