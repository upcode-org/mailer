import { readFileSync } from 'fs';
import * as amqplib from 'amqplib';

const rabbitCredentials = JSON.parse(readFileSync('.config/credentials.json', 'utf8')).rabbitMQ;

export const rabbitConnection = async (): Promise<amqplib.Connection> => {
    return amqplib.connect(`amqp://${rabbitCredentials.user}:${rabbitCredentials.password}@baboon.rmq.cloudamqp.com/${rabbitCredentials.user}?heartbeat=60`)
        .then( connection => {
            return connection;
        })
        .catch(err => {
            throw err;
        });
}

export const rabbitChannel = async (connection: amqplib.Connection): Promise<amqplib.Channel> => {
    return connection.createChannel()
        .then( ch => ch )
        .catch( err => {
            throw err;
        });
}