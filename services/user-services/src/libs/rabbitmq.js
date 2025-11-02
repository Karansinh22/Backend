const amqp = require('amqplib');
const { territoryCache } = require('../utils/territoryCache');
require('dotenv').config();

async function setupTerritoryRabbitMQ() {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();
        const queue = 'territory_updates';

        await channel.assertQueue(queue, { durable: true });
        console.log('Territory Service connected to RabbitMQ');

        channel.consume(queue, (msg) => {
            if (msg !== null) {
                const territoryData = JSON.parse(msg.content.toString());
                const cacheKey = `territory:${territoryData._id}`;
                if (territoryData.rabbitAction === 'delete') {
                    territoryCache.delete(cacheKey);
                    console.log(`Deleted user from cache: ${cacheKey}`);
                } else if (territoryData.rabbitAction === 'create' || territoryData.rabbitAction === 'update') {
                    territoryCache.set(cacheKey, territoryData);
                    console.log(`Territory Service | ${territoryData.rabbitAction} | territory: ${cacheKey}`);
                }
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error('RabbitMQ setup error:', error);
        throw error;
    }
}

async function publishUserUpdate(userData) {
    try {
        console.log("*****");
        console.log(userData);
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();
        const queue = 'user_updates';

        await channel.assertQueue(queue, { durable: true });
        const message = JSON.stringify(userData);
        console.log(message);
        channel.sendToQueue(queue, Buffer.from(message), { persistent: true });
        console.log(`Published user update: ${userData._id} (${userData.rabbitAction})`);

        // await channel.close();
        // await connection.close();
    } catch (error) {
        console.error('Error publishing to RabbitMQ:', error);
        throw error;
    }
}

async function publishAllUserUpdate(userData) {
    try {
        console.log("*****");
        console.log(userData);
        const connection = await amqp.connect(process.env.RABBITMQ_URL);
        const channel = await connection.createChannel();
        await channel.assertExchange('user_updates', 'fanout', { durable: true });
        const queue = 'user_updates';

        await channel.assertQueue(queue, { durable: true });
        const message = JSON.stringify(userData);
        console.log(message);
        channel.publish(queue, '' ,Buffer.from(message), { persistent: true });
        console.log(`Published user update: ${userData._id} (${userData.rabbitAction})`);

        // await channel.close();
        // await connection.close();
    } catch (error) {
        console.error('Error publishing to RabbitMQ:', error);
        throw error;
    }
}



module.exports = { setupTerritoryRabbitMQ, publishUserUpdate, publishAllUserUpdate };