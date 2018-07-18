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
const fs_1 = require("fs");
const amqplib = require("amqplib");
const rabbitCredentials = JSON.parse(fs_1.readFileSync('.config/credentials.json', 'utf8')).rabbitMQ;
exports.rabbitConnection = () => __awaiter(this, void 0, void 0, function* () {
    return amqplib.connect(`amqp://${rabbitCredentials.user}:${rabbitCredentials.password}@baboon.rmq.cloudamqp.com/${rabbitCredentials.user}?heartbeat=60`)
        .then(connection => {
        return connection;
    })
        .catch(err => {
        throw err;
    });
});
exports.rabbitChannel = (connection) => __awaiter(this, void 0, void 0, function* () {
    return connection.createChannel()
        .then(ch => ch)
        .catch(err => {
        throw err;
    });
});
//# sourceMappingURL=rabbitMQ.js.map