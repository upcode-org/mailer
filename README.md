# Mailer Service

1. Message arrives from RabbitMQ, it includes message id and message payload.

2. Email template is retrieved based on message id.

3. Email template is populated with values found in message payload to form an outbound message.

4. Outbound message is added to internal queue.

5. When email transport is idle, it will flush out internal queue by sending emails.

6. When email is sent or an error prevents it from being sent, it gets removed from RabbitMQ queue.






