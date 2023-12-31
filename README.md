# A minimalist raster tile server with nodejs, leaflet snd postGIS.

See [here](https://dev.to/leoalho/a-minimalist-raster-tile-server-with-express-and-postgis-79i) for the blog posts related to the project.

## Running the app

After cloning the directory, run `npm install`. After this one can start the project with `npm start` to run the project with node or `npm run dev` to run the project with nodemon. The app needs a running postgreSQL instance and two instances of Redis to work. BRanches 'simple' and 'features' do not require Redis.

## Environmental variables:

### Required

PGUSERNAME: postgres username\
PASSWORD: postgres password\
DATABASE: name of the database\
TABLE = Name of the table containing the data for the polygons\
TABLE2 = Name of the table containing osm basemap data\
REDISPORT = Port of the redis cache containing the prerendered tiles.

### Optional

HOSTNAME = Ip address of the host, default value 127.0.0.1\
PORT = Port for the server, default 8080\
PRERENDEREDTILES = The zoom level up to which there are prerendered tiles in the cache, default -1
