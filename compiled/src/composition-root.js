"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const container_1 = require("../lib/container");
exports.container = new container_1.AppContainer();
//*******************************************************************/
//Data dependecies 
const database_1 = require("./data/database");
//*******************************************************************/
//*******************************************************************/
//Monitoring dependecy 
const monitoring_service_1 = require("./services/monitoring-service");
//*******************************************************************/
//*******************************************************************/
//Application Dependencies 
const verification_email_consumer_1 = require("./services/verification-email-consumer");
const transporter_1 = require("./services/transporter");
//*******************************************************************/
exports.containerResolver = () => __awaiter(this, void 0, void 0, function* () {
    try {
        const mailerDb = yield database_1.mongoConnection();
        exports.container.singleton('mailerDb', mailerDb);
        exports.container.singleton('transporter', transporter_1.transporter);
        exports.container.singleton('verificationEmailConsumer', verification_email_consumer_1.VerificationEmailConsumer, ['mailerDb', 'transporter']);
        exports.container.singleton('monitoringService', monitoring_service_1.MonitoringService); // TO DO... copy from aip
        return exports.container;
    }
    catch (err) {
        throw err;
    }
});
//# sourceMappingURL=composition-root.js.map