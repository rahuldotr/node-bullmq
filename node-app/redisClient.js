const redis = require('redis');

function createRedisClient() {
    let client;

    (async () => {
        client = redis.createClient({
          socket: {
            host: "redis",
            port: 6379
          },
        });
        await client.connect();
        client.on("error", (error) => console.error(`Error : ${error}`));
      })();
      return client
}

const redisClient = createRedisClient();

module.exports = redisClient;
