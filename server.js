require("dotenv").config();
const { Client } = require("pg");
const express = require("express");
const path = require("path");

const PORT = process.env.PORT || 8080;
const HOSTNAME = process.env.HOSTNAME || "127.0.0.1";
const PUBLICPATH = path.join(__dirname, "./public");
const PGUSERNAME = process.env.PGUSERNAME;
const PASSWORD = process.env.PASSWORD;
const DATABASE = process.env.DATABASE;
const TABLE = process.env.TABLE;

const query = `
WITH rasters AS (
    SELECT ST_AsRaster(ST_collect(Array(SELECT ST_TileEnvelope($1,$2,$3))), 256, 256, ARRAY['8BUI', '8BUI', '8BUI'], ARRAY[179, 208, 255], ARRAY[0,0,0]) AS rast
    UNION ALL
    SELECT ST_AsRaster(
      ST_collect(Array(
          SELECT ST_Intersection(geom,ST_TileEnvelope($1,$2,$3)) FROM ${TABLE} UNION
          SELECT ST_boundary(ST_TileEnvelope($1,$2,$3))
      )
    ), 256, 256, ARRAY['8BUI', '8BUI', '8BUI'], ARRAY[251, 255, 194], ARRAY[0,0,0]) AS rast
    UNION ALL
    SELECT ST_AsRaster(
        ST_collect(Array(
            SELECT ST_boundary(ST_Intersection(geom,ST_TileEnvelope($1,$2,$3))) FROM ${TABLE} UNION
            SELECT ST_boundary(ST_TileEnvelope($1,$2,$3))
        )
    ), 256, 256, ARRAY['8BUI', '8BUI', '8BUI'], ARRAY[1,1,1], ARRAY[0,0,0]) AS rast
)
SELECT ST_AsPNG(ST_UNION(rast)) FROM rasters;
`;

const pathMakesSense = (z, x, y) => {
  const maxCoord = 2 ** z;
  return z >= 0 && z <= 20 && x >= 0 && x < maxCoord && y >= 0 && y < maxCoord;
};

const client = new Client({
  user: PGUSERNAME,
  database: DATABASE,
  password: PASSWORD,
});

client.connect();

let app = express();

app.get("/tiles/:z/:x/:y", async function (req, res) {
  const { z, x, y } = req.params;
  if (pathMakesSense(parseInt(z), parseInt(x), parseInt(y))) {
    try {
      let response = await client.query(query, [z, x, y]);
      img = response.rows[0].st_aspng;
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": img.length,
      });
      res.end(img);
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
