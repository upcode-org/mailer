"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
require("mocha");
const composition_root_1 = require("../composition-root");
describe('Verification Mailer Test:', function () {
    this.timeout(15000);
    let container;
    before(() => __awaiter(this, void 0, void 0, function* () {
        container = yield composition_root_1.containerResolver();
    }));
    it('should send a verification email', () => __awaiter(this, void 0, void 0, function* () {
        const verificationEmailConsumer = container.get('verificationEmailConsumer');
        const msg = { content: new Buffer('{"userId":"5b29160a9373381d14bcdb74","email":"svegalopez@gmail.com","firstName":"Sebastian","lastName":"Vega"}') };
        let result;
        try {
            result = yield verificationEmailConsumer.onMessage(msg);
        }
        catch (err) {
            result = err;
        }
        chai_1.expect(result).to.satisfy((result) => {
            console.log('RESULT: ', result.substring(0, 3));
            if (result && result.substring(0, 3) === '250')
                return true;
            return false;
        });
    }));
    after(() => {
        const verificationEmailConsumer = container.get('verificationEmailConsumer');
        verificationEmailConsumer.transporter.close();
    });
});
//# sourceMappingURL=verification-email-consumer.spec.js.map