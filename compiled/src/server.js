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
const composition_root_1 = require("./composition-root");
composition_root_1.containerResolver()
    .then((container) => __awaiter(this, void 0, void 0, function* () {
    const verificationEmailConsumer = container.get('verificationEmailConsumer');
    yield verificationEmailConsumer.connect();
    console.log('ready to send emails...');
    //TO DO... catch uncaught exceptions and report
}))
    .catch(err => console.log('unable to start server', err));
//# sourceMappingURL=server.js.map