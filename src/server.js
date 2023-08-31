require("dotenv").config();
const { Client } = require("pg");
const express = require("express");
const path = require("path");
const { createClient } = require("redis");

const { query } = require("./query");
const { connectClient } = require("./pgConnect");
const { REDIS_PORT } = require("./config");
const PORT = process.env.PORT || 8080;
const HOSTNAME = process.env.HOSTNAME || "127.0.0.1";
const RENDEREDTILES = parseInt(process.env.RENDEREDTILES) || -1;
const PUBLICPATH = path.join(__dirname, "../public");
const REDISPORT = process.env.REDISPORT;

const pathMakesSense = (z, x, y) => {
  const maxCoord = 2 ** z;
  return z >= 0 && z <= 20 && x >= 0 && x < maxCoord && y >= 0 && y < maxCoord;
};

const pg_client = connectClient();

const redis_client = createClient();
redis_client.on("error", (err) => console.log("Redis Client Error", err));

console.log("Connecting to redis");
redis_client.connect();

const preRendered_client = createClient({
  url: `redis://localhost:${REDIS_PORT}`,
});

console.log("Conecting to prerendered tiles database");
preRendered_client.connect();

let app = express();

app.get("/tiles/:z/:x/:y", async function (req, res) {
  const { z, x, y } = req.params;
  if (pathMakesSense(parseInt(z), parseInt(x), parseInt(y))) {
    try {
      if (z <= RENDEREDTILES) {
        let preRenderedRedisValue = await preRendered_client.get(
          `${z}_${x}_${y}`
        );
        res.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": Buffer.from(preRenderedRedisValue, "hex").length,
        });
        res.end(Buffer.from(preRenderedRedisValue, "hex"));
        return;
      }
      let redisValue = await redis_client.get(`${z}_${x}_${y}`);
      if (redisValue) {
        res.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": Buffer.from(redisValue, "hex").length,
        });
        res.end(Buffer.from(redisValue, "hex"));
      } else {
        let response = await pg_client.query(query, [z, x, y]);
        let img = response.rows[0].st_aspng;
        res.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": img.length,
        });
        res.end(img);
        redis_client.set(`${z}_${x}_${y}`, img.toString("hex"));
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    res.writeHead(400);
    res.end("Incorrect path");
  }
});

app.use(express.static(PUBLICPATH));

app.listen(PORT, HOSTNAME, () => {
  console.log(`Listening on ${HOSTNAME}, port ${PORT}`);
});
