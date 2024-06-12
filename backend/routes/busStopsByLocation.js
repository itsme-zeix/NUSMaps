const dotenv = require("dotenv").config();
const express = require("express");
const router = express.Router();
const { Client } = require("pg");

// Create bus stop objects (based on interface defined in front end, see comment inside the method) using bus stop info retrieved from database in getNearestBusStops method.
async function generateBusStopsObject(stop) {
  // Interface in our tsx frontend for reference so we can reuse them when returning JSON.
  // interface BusService {
  //   busNumber: string;
  //   timings: string[]; // ISO format
  // }
  // interface BusStop {
  //   busStopName: string;
  //   busStopId: string;
  //   distanceAway: string;
  //   savedBuses: BusService[];
  // }

  // initialize bus stop objeect
  const busStopObject = {
    busStopName: stop.name,
    busStopId: String(stop.id),
    distanceAway: String(stop.distance),
    savedBuses: [], // this is an array length = services.length that contains BusStop objects/
  };

  // initialize each of the bus services at a bus stop
  for (const service of stop.services) {
    const busService = {
      busNumber: service,
      timings: [], // contains 2 strings which is the time in ISO format.
    };
    busStopObject.savedBuses.push(busService); // insert bus services into bus stop
  }
  return busStopObject;
}
// This function obtains x of the nearest bus stops formatted as busStopObjects.
async function getNearestBusStops(userLat, userLon) {
  // NOTE:
  // Since there are only ~5000 bus stops, we are able to skip optimizations such as adding buckets by 1km radius.
  // Instead, we can just calculate the euclidean distance synchronously (calculating asynchrononously doesn't speed up much here).
  // Connect to PostgreSQL server

  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: true, // Note that this is required to connect to the Render server.
  });

  // Calculate distance function abstracted out to use in the calculation below
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const R = 6371; // Radius of the Earth in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  // Query for bus stops and filter by distance from user location.
  try {
    await client.connect();
    const res = await client.query(
      "SELECT id, name, latitude, longitude, services FROM busstops"
    );
    const busStops = res.rows;
    const nearbyStops = busStops
      .map((stop) => {
        const stopLat = stop.latitude;
        const stopLon = stop.longitude;
        const name = stop.name;
        const services = stop.services;
        const distance = haversineDistance(userLat, userLon, stopLat, stopLon);
        return { id: stop.id, name, distance, services };
      })
      .sort((a, b) => a.distance - b.distance) // Sort by distance
      .slice(0, 2); // Get the 10 nearest stops

    // Format the bus stops properly so that timings can be inserted easily once retrieved.
    const arrBusStops = [];
    for (stop of nearbyStops) {
      const busStopObject = await generateBusStopsObject(stop);
      arrBusStops.push(busStopObject);
    }
    return arrBusStops;
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
  return;
}

// Insert the arrival times (retrieved from API) into the bus stops array.
// Functionally the same as calling /busStopArrivalTimes, but we avoid calling the internal API, despite the abstraction, as it will mean that we have to wait
// for multiple calls to complete synchronously, increasing our API's response time.
async function getArrivalTime(busStopsArray) {
  for (const busStop of busStopsArray) {
    for (const bus of busStop.savedBuses) {
      await (async (stopId, serviceNo) => {
        console.log(stopId, serviceNo);
        try {
          const response = await fetch(
            `http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=${stopId}&ServiceNo=${serviceNo}`,
            {
              method: "GET",
              headers: {
                AccountKey: process.env.LTA_DATAMALL_KEY,
              },
            }
          );

          // Check if the response is ok and has a body
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const text = await response.text();
          if (!text) {
            throw new Error("Empty response body from datamall");
          }

          const datamallReply = JSON.parse(text);
          console.log(datamallReply);
          if (!datamallReply.Services) {
            throw new Error("Unexpected response format from datamall");
          }
          if (datamallReply.Services.length == 0) {
            bus.timings = ["N.A.", "N.A."];
          } else {
            const firstArrivalTime =
              datamallReply.Services[0].NextBus.EstimatedArrival;
            const secondArrivalTime =
              datamallReply.Services[0].NextBus2.EstimatedArrival;
            bus.timings = [firstArrivalTime, secondArrivalTime];
          }
          console.log(bus);
        } catch (error) {
          console.error("Error fetching data from datamall:", error);
        }
      })(busStop.busStopId, bus.busNumber);
    }
  }
}

// GET request that takes location coordinates and returns a busStops object with updated arrival timings of buses.
// The bus stops should be within x distance of the location.
router.get("/", async (req, res) => {
  const authorizationHeader = req.get("Authorization");
  const { latitude, longitude } = req.query;

  console.log("Received GET /busStopsByLocation");

  // Add authorization check
  // if (!authorizationHeader || authorizationHeader !== 'expectedValue') {
  //   return res.status(403).send("Forbidden");
  // }
  try {
    (async () => {
      const busStopsArray = await getNearestBusStops(latitude, longitude);
      console.log(busStopsArray);
      await getArrivalTime(busStopsArray); // insert arrival times
      res.json(busStopsArray);
    })();
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
