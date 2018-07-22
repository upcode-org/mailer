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
const container_1 = require("./lib/container");
exports.container = new container_1.AppContainer();
//*******************************************************************/
//Connection dependecies 
const database_1 = require("./connections/database");
const rabbitMQ_1 = require("./connections/rabbitMQ");
//*******************************************************************/
//*******************************************************************/
//Monitoring dependecy 
const monitoring_service_1 = require("./services/monitoring-service");
const logger_1 = require("./services/logger");
//*******************************************************************/
//*******************************************************************/
//Application Dependencies 
const email_consumer_1 = require("./services/email-consumer/email-consumer");
const transporter_1 = require("./services/transporter");
//*******************************************************************/
exports.containerResolver = () => __awaiter(this, void 0, void 0, function* () {
    try {
        const mailerDb = yield database_1.mongoConnection();
        const rmqConnection = yield rabbitMQ_1.rabbitConnection();
        const emailConsumerCh = yield rabbitMQ_1.rabbitChannel(rmqConnection);
        const monServCh = yield rabbitMQ_1.rabbitChannel(rmqConnection);
        exports.container.singleton('mailerDb', mailerDb);
        exports.container.singleton('emailConsumerCh', emailConsumerCh);
        exports.container.singleton('monServCh', monServCh);
        exports.container.singleton('transporter', transporter_1.transporter);
        exports.container.singleton('logger', logger_1.logger);
        exports.container.singleton('monitoringService', monitoring_service_1.MonitoringService, ['logger', 'monServCh']); // TO DO... copy from aip
        exports.container.singleton('emailConsumer', email_consumer_1.EmailConsumer, ['mailerDb', 'transporter', 'emailConsumerCh', 'monitoringService']);
        return exports.container;
    }
    catch (err) {
        throw err;
    }
});
//# sourceMappingURL=composition-root.js.map