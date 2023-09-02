require("dotenv").config();
const { createClient } = require("redis");
const pg = require("./pgConnect");
const { query } = require("./query");

const REDIS_PORT = process.env.REDISPORT;
const LIMIT = parseInt(process.argv[2]);
const TILES = (1 - Math.pow(4, LIMIT + 1)) / -3;

const redis_client = createClient({
  url: `redis://localhost:${REDIS_PORT}`,
});

const pg_client = pg.connectClient();

const render = async () => {
  await redis_client.flushAll();
  let startTime = Date.now();
  let counter = 0;
  for (let i = 0; i <= LIMIT; i++) {
    for (let j = 0; j < Math.pow(2, i); j++) {
      for (let k = 0; k < Math.pow(2, i); k++) {
        let response = await pg_client.query(query, [i, j, k]);
        let img = response.rows[0].st_aspng;
        await redis_client.set(`${i}_${j}_${k}`, img.toString("hex"));

        counter++;
        let currentTime = Date.now();
        console.log(
          `Renderer tile ${i}/${j}/${k}, tiles left: ${
            TILES - counter
          }, time elapsed: ${((currentTime - startTime) / 1000).toFixed(
            2
          )} s, average rendering time: ${(
            (currentTime - startTime) /
            (counter * 1000)
          ).toFixed(2)} s `
        );
      }
    }
  }
};

const main = async () => {
  await redis_client.connect();
  await render();
  await redis_client.disconnect();
  await pg_client.end();
};

main();
