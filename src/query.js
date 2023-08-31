const TABLE = process.env.TABLE;
const TABLE2 = process.env.TABLE2;

const background =
  "SELECT ST_AsRaster(ST_collect(Array(SELECT ST_TileEnvelope($1,$2,$3))), 256, 256, ARRAY['8BUI', '8BUI', '8BUI'], ARRAY[179, 208, 255], ARRAY[0,0,0]) AS rast";

const land_polygons = `
    SELECT ST_AsRaster(
        ST_collect(Array(
            SELECT ST_Intersection(geom,ST_TileEnvelope($1,$2,$3)) FROM ${TABLE} UNION
            SELECT ST_boundary(ST_TileEnvelope($1,$2,$3))
        )
    ), 256, 256, ARRAY['8BUI', '8BUI', '8BUI'], ARRAY[251, 255, 194], ARRAY[0,0,0]) AS rast
`;

const coastline = `
    SELECT ST_AsRaster(
        ST_collect(Array(
            SELECT ST_boundary(ST_Intersection(geom,ST_TileEnvelope($1,$2,$3))) FROM ${TABLE} UNION
            SELECT ST_boundary(ST_TileEnvelope($1,$2,$3))
        )
    ), 256, 256, ARRAY['8BUI', '8BUI', '8BUI'], ARRAY[1,1,1], ARRAY[0,0,0]) AS rast
`;

const highways = `
    SELECT ST_AsRaster(
        ST_collect(Array(
            SELECT ST_Intersection(ST_collect(Array(SELECT way FROM ${TABLE2} WHERE highway IN ('motorway', 'trunk', 'primary'))),ST_TileEnvelope($1,$2,$3))  UNION
            SELECT ST_boundary(ST_TileEnvelope($1,$2,$3))
        )
    ), 256, 256, ARRAY['8BUI', '8BUI', '8BUI'], ARRAY[1,1,1], ARRAY[0,0,0]) AS rast
`;

const query = `
WITH rasters AS (
    ${background}
    UNION ALL
    ${land_polygons}
    UNION ALL
    ${coastline}
    UNION ALL
    ${highways}
)
SELECT ST_AsPNG(ST_UNION(rast)) FROM rasters;
`;

module.exports = { query };
