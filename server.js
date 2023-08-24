require("dotenv").config();
const { Client } = require("pg");
const express = require("express");
const path = require("path");
const { createClient } = require("redis");

const PORT = process.env.PORT || 8080;
const HOSTNAME = process.env.HOSTNAME || "127.0.0.1";
const PUBLICPATH = path.join(__dirname, "./public");
const PGUSERNAME = process.env.PGUSERNAME;
const PASSWORD = process.env.PASSWORD;
const DATABASE = process.env.DATABASE;
const TABLE = process.env.TABLE;

const client = new Client({
  user: PGUSERNAME,
  database: DATABASE,
  password: PASSWORD,
});

console.log("Connecting to postgres");
client.connect();
console.log("Connected to Postgres");

const redis_client = createClient();

redis_client.on("error", (err) => console.log("Redis Client Error", err));

console.log("Connecting to redis");
redis_client.connect();
console.log("Connected to redis");

let query = `
SELECT ST_AsPNG(
  ST_AsRaster(
      ST_collect(Array(
          SELECT ST_Intersection(geom,ST_TileEnvelope($1,$2,$3)) FROM ${TABLE} UNION
          SELECT ST_boundary(ST_TileEnvelope($1,$2,$3))
      )
  ), 256, 256, ARRAY['8BUI', '8BUI', '8BUI'], ARRAY[100,100,100], ARRAY[0,0,0])
);
`;

function pathMakesSense(z, x, y) {
  let maxCoord = 2 ** z;
  return z >= 0 && z <= 20 && x >= 0 && x < maxCoord && y >= 0 && y < maxCoord;
}

let app = express();

app.get("/tiles/:z/:x/:y", async function (req, res) {
  const { z, x, y } = req.params;
  if (pathMakesSense(parseInt(z), parseInt(x), parseInt(y))) {
    try {
      redisValue = await redis_client.get(`${z}_${x}_${y}`);
      if (redisValue) {
        res.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": Buffer.from(redisValue, "hex").length,
        });
        res.end(Buffer.from(redisValue, "hex"));
      } else {
        let response = await client.query(query, [z, x, y]);
        img = response.rows[0].st_aspng;
        res.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": img.length,
        });
        res.end(img);
        console.log(`Rendered ${z}, ${x}, ${y}`);
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
