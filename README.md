# Mailer Service

This web service subscribes to RabbitMQ queues, and sends emails when the queues publish a message.

----------

You will need: node.js, nodemon & typescript installed in your machine.

## DEV ENVIRONMENT

1. To run the service first install the project dependencies by typing "npm install" or "yarn".

2. You will then have to compile the typescript code in the "src" folder. Do this by typing "npm run compile". The compiled javascript will be place in the "dist" folder and the typescript compiler will watch for changes.

3. Finally you can type "npm run server" in a separate terminal tab. This will start the consumers by connecting to RabbitMQ. A consumer will listen for messages, and will send an email once it receives a message.




