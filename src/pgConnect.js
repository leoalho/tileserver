const { Client } = require("pg");

const PGUSERNAME = process.env.PGUSERNAME;
const PASSWORD = process.env.PASSWORD;
const DATABASE = process.env.DATABASE;

const connectClient = () => {
  const client = new Client({
    user: PGUSERNAME,
    database: DATABASE,
    password: PASSWORD,
  });

  console.log(`Connecting to Postgres database ${DATABASE}`);
  client.connect();

  return client;
};

module.exports = { connectClient };
