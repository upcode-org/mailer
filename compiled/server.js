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
    const emailConsumer = container.get('emailConsumer');
    const monitoringService = container.get('monitoringService');
    yield emailConsumer.connect();
    console.log('ready to send emails...');
    process.on('uncaughtException', (err) => {
        monitoringService.log(`Uncaught exception: ${err}`, process.pid);
        process.exit(1);
    });
}))
    .catch(err => console.log('unable to start server', err));
//# sourceMappingURL=server.js.map