const amqp = require('amqplib');
const redisClient = require('./redisClient');

const QUEUE_NAME = 'race_queue';


async function main() {
  
  const connection = await amqp.connect('amqp://rabbitmq');
  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  let counter = 0;

  setInterval(async () => {
    counter++;
    console.log("Sending message to channel: ", counter.toString())
    channel.sendToQueue(QUEUE_NAME, Buffer.from(counter.toString()), { persistent: true });
    await redisClient.set('counter', counter);
    
  }, 1000);



  const channel2 = await connection.createChannel();
  await channel2.assertQueue(QUEUE_NAME, { durable: true });

  console.log('Waiting for messages...');
  channel2.consume(QUEUE_NAME, async (msg) => {
    const counter2 = parseInt(msg.content.toString());
    console.log('Received message:', counter2);

    let currentCounter = parseInt( await redisClient.get('counter'))
    if (counter2 === currentCounter + 1) {
        console.log('Counter updated correctly in Redis:', counter2);
        channel2.ack(msg);
    } else {
        console.error('Race condition detected! Expected:', currentCounter + 1, 'Actual:', counter2);
        channel2.nack(msg);
    }
  });
}

main().catch(console.error);
