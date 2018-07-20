"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const fs = require("fs");
const dbCredentials = JSON.parse(fs.readFileSync('.config/credentials.json', 'utf8')).mongodb;
const username = dbCredentials.username;
const password = dbCredentials.password;
const host = dbCredentials.host;
const dbName = dbCredentials.dbName;
const connectionString = `mongodb+srv://${username}:${password}@${host}`;
exports.mongoConnection = () => {
    return mongodb_1.MongoClient.connect(connectionString)
        .then((client) => {
        const mailerDb = client.db(dbName);
        console.log('connected to database: ', mailerDb.databaseName);
        return mailerDb;
    })
        .catch(err => {
        throw err;
    });
};
//# sourceMappingURL=database.js.map