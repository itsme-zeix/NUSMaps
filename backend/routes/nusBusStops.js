const dotenv = require("dotenv").config();
const express = require("express");
const router = express.Router();
const { Pool } = require("pg");
const axios = require("axios");
const NodeCache = require("node-cache");

// Initialize database pool to reduce latency on connect/disconnect
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: true, // Note that this is required to connect to the Render server.
});

// Initialize cache with TTL of 7200 seconds (2 hours).
// This will cache the NUS bus stop data retrieved from our PostgreSQL server
const cache = new NodeCache({ stdTTL: 7200 });

async function generateBusStopsObject(stop) {
  // Initialize bus stop object
  const busStopObject = {
    busStopName: stop.name,
    busStopId: String(stop.id),
    distanceAway: String(stop.distance),
    savedBuses: [], // This is an array length = services.length that contains BusStop objects
  };

  // Initialize each of the bus services at a bus stop
  for (const service of stop.services) {
    const busService = {
      busNumber: service,
      timings: [], // Contains 2 strings which is the time in ISO format
    };
    busStopObject.savedBuses.push(busService); // Insert bus services into bus stop
  }
  return busStopObject;
}

// This function obtains all of the NUS Bus Stops formatted as busStopObjects.
async function getNUSBusStops() {
  const cachedBusStops = cache.get("nusBusStops");
  if (cachedBusStops) {
    return cachedBusStops;
  }

  try {
    const res = await pool.query(
      "SELECT id, name, latitude, longitude, services FROM busstops WHERE name LIKE 'NUSSTOP%'"
    );
    const busStops = res.rows;
    const nusBusStops = busStops.map((stop) => ({
      id: stop.id,
      name: stop.name,
      services: stop.services,
    }));

    const busStopsPromises = nusBusStops.map((stop) =>
      generateBusStopsObject(stop)
    );
    const busStopsArray = await Promise.all(busStopsPromises);

    cache.set("nusBusStops", busStopsArray); // Cache the bus stops

    return busStopsArray;
  } catch (err) {
    console.error("Error with PostgreSQL call:", err);
    throw err;
  }
}

// Insert the arrival times (retrieved from API) into the bus stops array.
async function getArrivalTime(busStopsArray) {
  const promises = busStopsArray.map(async (busStop) => {
    const stopName = busStop.busStopName.substring(8); // substring(8) skips the first 8 characters 'NUSSTOP_'
    try {
      const username = process.env.NUSNEXTBUS_USER;
      const password = process.env.NUSNEXTBUS_PASSWORD;
      const credentials = Buffer.from(`${username}:${password}`).toString(
        "base64"
      );

      const response = await axios.get(
        `https://nnextbus.nus.edu.sg/ShuttleService?busstopname=${stopName}`,
        {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      if (response.status !== 200 || !response.data) {
        throw new Error(`Error from NUSNextBus API: ${response.status}`);
      }

      const NUSReply = response.data;
      // We will process the NUSReply in a 2 step process:
      // 1) reformat reply such that we can search the buses by name in a dict.
      // 2) iterate through buses in our bus stop objects and retrieve the timings based on the name.
      const shuttles = NUSReply.ShuttleServiceResult.shuttles.reduce(
        (acc, shuttle) => {
          acc[shuttle.name] = shuttle;
          return acc;
        },
        {}
      );

      for (let busObject of busStop.savedBuses) {
        const serviceName = busObject.busNumber;
        if (shuttles[serviceName]) {
          const shuttle = shuttles[serviceName];
          const currentTime = new Date();
          if (shuttle._etas) {
            // These are NUS buses. Public buses do not have ._etas field in NUSNextBus API response.
            // Handle the cases of differing sizes of etas returned due to 0/1/2 next buses.
            // ETA is not given in ISO time, so we have to calculate the ISO time based on mins till arrival.
            const etaLength = shuttle._etas.length;
            if (etaLength === 0) {
              busObject.timings = ["N.A.", "N.A."];
            } else if (etaLength === 1) {
              const firstArrivalTime = new Date(
                currentTime.getTime() + shuttle._etas[0].eta_s * 1000
              ).toISOString();
              busObject.timings = [firstArrivalTime, "N.A."];
            } else {
              const firstArrivalTime = new Date(
                currentTime.getTime() + shuttle._etas[0].eta_s * 1000
              ).toISOString();
              const secondArrivalTime = new Date(
                currentTime.getTime() + shuttle._etas[1].eta_s * 1000
              ).toISOString();
              busObject.timings = [firstArrivalTime, secondArrivalTime];
            }
          } else {
            // Public bus timings obtained by NUSNextBus API is given in mins to arrival rather than ISO time.
            // The code below converts arrival time in minutes to ISO time to maintain a standard response format.
            const arrivalTime = isNaN(shuttle.arrivalTime)
              ? 0
              : shuttle.arrivalTime;
            const nextArrivalTime = isNaN(shuttle.nextArrivalTime)
              ? 0
              : shuttle.nextArrivalTime;
            const firstArrivalTime = new Date(
              currentTime.getTime() + arrivalTime * 60000
            ).toISOString();
            const secondArrivalTime = new Date(
              currentTime.getTime() + nextArrivalTime * 60000
            ).toISOString();
            busObject.timings = [firstArrivalTime, secondArrivalTime];
          }
        }
      }
      // Update NUS Bus Stop name to be the full name rather than the code name (i.e. NUSSTOP_YIH-OPP -> NUSSTOP_Opp Yusof Ishak House).
      busStop.busStopName = "NUSSTOP_" + NUSReply.ShuttleServiceResult.caption;
    } catch (error) {
      console.error("Error fetching data from NUSNextBus API:", error);
    }
  });

  await Promise.all(promises);
}

// GET request that takes location coordinates and returns a busStops object with updated arrival timings of buses.
// The bus stops should be within x distance of the location.
router.get("/", async (req, res) => {
  const authorizationHeader = req.get("Authorization");

  console.log("Received GET /nusBusStops");

  // Add authorization check
  // if (!authorizationHeader || authorizationHeader !== 'expectedValue') {
  //   return res.status(403).send("Forbidden");
  // }

  try {
    const busStopsArray = await getNUSBusStops();
    await getArrivalTime(busStopsArray);
    res.json(busStopsArray);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
