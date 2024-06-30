const dotenv = require("dotenv").config();
const express = require("express");
const router = express.Router();
const { Client } = require("pg");

async function generateBusStopsObject(stop) {
  const busStopObject = {
    busStopName: stop.name,
    busStopId: stop.id,
    savedBuses: stop.services, // we store the bus services as strings.
  };
}

async function getBusStops() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: true, // Note that this is required to connect to the Render server.
  });

  // Query for bus stops and filter by distance from user location.
  try {
    await client.connect();
    const res = await client.query(
      "SELECT id, name, latitude, longitude, services FROM busstops"
    );
    const busStops = res.rows;

    // Format the bus stops properly so that timings can be inserted easily once retrieved.
    const arrBusStops = await Promise.all(
      nearbyStops.map((stop) => generateBusStopsObject(stop))
    );
    return arrBusStops;
  } catch (err) {
    console.error(
      "busStopsByLocation encountered an error with PostgreSQL call:" + err
    );
  } finally {
    await client.end();
  }
  return;
}

router.get("/", async (req, res) => {
  const authorizationHeader = req.get("Authorization");
  const { lastUpdated } = req.query;

  console.log("Received GET /busStopsDatabase");

  // Add authorization check
  // if (!authorizationHeader || authorizationHeader !== 'expectedValue') {
  //   return res.status(403).send("Forbidden");
  // }

  try {
    (async () => {
      const busStopsArray = await getBusStops();
      res.json(busStopsArray);
    })();
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});
