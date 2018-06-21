export class UnableToSendMail extends Error {
    
    code: number = 1;

    constructor(message){
        super(message)
    }
}

export class MissingFields extends Error {
    
    code: number = 2;

    constructor(message){
        super(message)
    }
}
