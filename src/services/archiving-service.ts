import { Db, Collection, InsertOneWriteOpResult } from 'mongodb';

export class ArchivingService {
    
    eventsCollection: Collection;

    constructor(mailerDb: Db){
        this.eventsCollection = mailerDb.collection('mailer-events');
    }

    archiveEvent(event): void {
        const now = new Date();
        event.event_date = now;
        event.event_date_tzo = now.getTimezoneOffset();
        
        this.eventsCollection.insertOne(event)
            .then(res => null)
            .catch(err => console.log(err));
    }
    
}