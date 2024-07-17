const express = require("express");
const router = express.Router();
const axios = require("axios");
const cache = require("./sharedmodules/cache");
const pool = require('./sharedmodules/dbPool'); 

// Function to generate bus stops object
async function generateBusStopsObject(stop) {
  const busStopObject = {
    busStopName: stop.name,
    busStopId: String(stop.id),
    latitude: stop.latitude,
    longitude: stop.longitude,
    distanceAway: String(stop.distance),
    savedBuses: [],
  };

  for (const service of stop.services) {
    const busService = {
      busNumber: service,
      timings: [],
    };
    busStopObject.savedBuses.push(busService);
  }
  return busStopObject;
}

// Function to get NUS Bus Stops
async function getNUSBusStops() {
  const cachedBusStops = cache.get("nusBusStops");
  if (cachedBusStops) {
    return cachedBusStops;
  }

  try {
    const res = await pool.query("SELECT id, name, latitude, longitude, services FROM busstops WHERE name LIKE 'NUSSTOP%'");
    const busStops = res.rows;
    const nusBusStops = busStops.map((stop) => ({
      id: stop.id,
      name: stop.name,
      services: stop.services,
      latitude: stop.latitude,
      longitude: stop.longitude,
    }));

    const busStopsPromises = nusBusStops.map((stop) => generateBusStopsObject(stop));
    const busStopsArray = await Promise.all(busStopsPromises);

    cache.set("nusBusStops", busStopsArray, 7200); // Cache for 2 hours

    return busStopsArray;
  } catch (err) {
    console.error("Error with PostgreSQL call:", err);
    throw err;
  }
}

// Function to get arrival times
async function getArrivalTime(busStopsArray) {
  const promises = busStopsArray.map(async (busStop) => {
    const stopName = busStop.busStopName.substring(8);
    const cacheKey = `arrivalTimes_${stopName}`;
    const cachedArrivalTimes = cache.get(cacheKey);

    if (cachedArrivalTimes) {
      busStop.savedBuses = cachedArrivalTimes;
      return;
    }

    try {
      const username = process.env.NUSNEXTBUS_USER;
      const password = process.env.NUSNEXTBUS_PASSWORD;
      const credentials = Buffer.from(`${username}:${password}`).toString("base64");

      const response = await axios.get(`https://nnextbus.nus.edu.sg/ShuttleService?busstopname=${stopName}`, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });

      if (response.status !== 200 || !response.data) {
        throw new Error(`Error from NUSNextBus API: ${response.status}`);
      }

      const NUSReply = response.data;
      const shuttles = NUSReply.ShuttleServiceResult.shuttles.reduce((acc, shuttle) => {
        acc[shuttle.name] = shuttle;
        return acc;
      }, {});

      for (let busObject of busStop.savedBuses) {
        const serviceName = busObject.busNumber;
        if (shuttles[serviceName]) {
          const shuttle = shuttles[serviceName];
          const currentTime = new Date();
          if (shuttle._etas) {
            const etaLength = shuttle._etas.length;
            if (etaLength === 0) {
              busObject.timings = ["N.A.", "N.A."];
            } else if (etaLength === 1) {
              const firstArrivalTime = new Date(currentTime.getTime() + shuttle._etas[0].eta_s * 1000).toISOString();
              busObject.timings = [firstArrivalTime, "N.A."];
            } else {
              const firstArrivalTime = new Date(currentTime.getTime() + shuttle._etas[0].eta_s * 1000).toISOString();
              const secondArrivalTime = new Date(currentTime.getTime() + shuttle._etas[1].eta_s * 1000).toISOString();
              busObject.timings = [firstArrivalTime, secondArrivalTime];
            }
          } else {
            const arrivalTime = isNaN(shuttle.arrivalTime) ? 0 : shuttle.arrivalTime;
            const nextArrivalTime = isNaN(shuttle.nextArrivalTime) ? 0 : shuttle.nextArrivalTime;
            const firstArrivalTime = new Date(currentTime.getTime() + arrivalTime * 60000).toISOString();
            const secondArrivalTime = new Date(currentTime.getTime() + nextArrivalTime * 60000).toISOString();
            busObject.timings = [firstArrivalTime, secondArrivalTime];
          }
        }
      }

      cache.set(cacheKey, busStop.savedBuses, 30); // Cache for 30 seconds

      busStop.busStopName = "NUSSTOP_" + NUSReply.ShuttleServiceResult.caption;
    } catch (error) {
      console.error("Error fetching data from NUSNextBus API:", error);
    }
  });

  await Promise.all(promises);
}

// Haversine formula to calculate distance between two points
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in kilometers

  return d;
}

// Function to calculate the distance of each bus stop from the user
async function calculateUserDistance(busStopsArray, userLat, userLon) {
  busStopsArray.forEach((busStop) => {
    const distance = haversineDistance(userLat, userLon, busStop.latitude, busStop.longitude);
    busStop.distanceAway = distance.toFixed(2); // Update the distance in the bus stop object
  });
}

// GET request to return bus stops with updated arrival timings
router.get("/", async (req, res) => {
  const authorizationHeader = req.get("Authorization");
  const { latitude, longitude } = req.query;

  console.log("Received GET /nusBusStops");

  // Add authorization check
  // if (!authorizationHeader || authorizationHeader !== 'expectedValue') {
  //   return res.status(403).send("Forbidden");
  // }

  try {
    const busStopsArray = await getNUSBusStops();
    await getArrivalTime(busStopsArray);
    await calculateUserDistance(busStopsArray);
    await calculateUserDistance(busStopsArray, parseFloat(latitude), parseFloat(longitude));
    res.json(busStopsArray);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
