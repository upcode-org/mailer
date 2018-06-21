import { readFileSync } from 'fs';
import * as amqplib from 'amqplib';

const rabbitCredentials = JSON.parse(readFileSync('.config/credentials.json', 'utf8')).rabbitMQ;

export const rabbitConnection = async (): Promise<amqplib.Connection> => {
    return amqplib.connect(`amqp://${rabbitCredentials.user}:${rabbitCredentials.password}@baboon.rmq.cloudamqp.com/${rabbitCredentials.user}?heartbeat=60`)
        .then( connection => {
            console.log('connected to RabbitMQ server');
            return connection;
        })
        .catch(err => {
            throw err;
        });
}