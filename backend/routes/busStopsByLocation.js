const dotenv = require("dotenv").config();
const express = require("express");
const router = express.Router();
const { Client } = require("pg");
const axios = require("axios");
const cache = require("./sharedmodules/cache");
const pool = require("./sharedmodules/dbPool");

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

  // initialize bus stop object
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

// Haversine Distance Calculation
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const R = 6371; // radius of the Earth in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon1 - lon2);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
}

// Helper function to quantize coordinate (~1.11139 metres)
function quantizeCoordinate(value, precision = 5) {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}

// This function obtains x of the nearest bus stops formatted as busStopObjects.
// Get nearest bus stops
async function getNearestBusStops(userLat, userLon) {
  const quantizedLat = quantizeCoordinate(userLat);
  const quantizedLon = quantizeCoordinate(userLon);
  const cacheKey = `nearestBusStops_${quantizedLat}_${quantizedLon}`;
  const cachedBusStops = cache.get(cacheKey);
  if (cachedBusStops) {
    return cachedBusStops;
  }

  // Calculate bounding box (approx. 3km radius)
  const latDiff = 0.03; // Roughly equal to 3km
  const lonDiff = 0.03; // Roughly equal to 3km

  const minLat = Number(userLat - latDiff);
  const maxLat = Number(userLat + latDiff);
  const minLon = Number(userLon - lonDiff);
  const maxLon = Number(userLon + lonDiff);

  const query = `
    SELECT id, name, latitude, longitude, services
    FROM busstops
    WHERE latitude BETWEEN $1 AND $2
    AND longitude BETWEEN $3 AND $4
  `;

  try {
    const res = await pool.query(query, [minLat, maxLat, minLon, maxLon]);
    const busStops = res.rows;

    // Calculate distances and sort
    const nearbyStops = busStops
      .map((stop) => ({
        ...stop,
        distance: haversineDistance(userLat, userLon, stop.latitude, stop.longitude),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);

    const arrBusStops = await Promise.all(nearbyStops.map((stop) => generateBusStopsObject(stop)));

    cache.set(cacheKey, arrBusStops, 300); // Cache for 5 minutes
    return arrBusStops;
  } catch (err) {
    console.error("Error fetching nearest bus stops:", err);
    throw err;
  }
}

// Insert the arrival times (retrieved from API) into the bus stops array.
// Functionally the same as calling /busStopArrivalTimes, but we avoid calling the internal API, despite the abstraction, as it will mean that we have to wait
// for multiple calls to complete synchronously, increasing our API's response time.
async function getArrivalTime(busStopsArray) {
  await Promise.all(
    busStopsArray.map(async (busStop) => {
      if (busStop.busStopName.startsWith("NUSSTOP")) {
        const stopName = busStop.busStopName.substring(8); // substring(8) skips the first 8 characters 'NUSSTOP_'
        const cacheKey = `arrivalTimes_${stopName}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
          busStop.savedBuses = cachedData;
        } else {
          try {
            const username = process.env.NUSNEXTBUS_USER;
            const password = process.env.NUSNEXTBUS_PASSWORD;
            const credentials = Buffer.from(`${username}:${password}`).toString("base64");

            const response = await axios.get(`https://nnextbus.nus.edu.sg/ShuttleService?busstopname=${stopName}`, {
              headers: { Authorization: `Basic ${credentials}` },
            });

            // Check if the response is ok and has a body
            if (response.status !== 200) {
              throw new Error(`HTTP error from NUSNextBus API! status: ${response.status}`);
            }

            if (!response.data) {
              throw new Error("Empty response body from NUSNextBus API");
            }

            const NUSReply = response.data;
            // We will process the NUSReply in a 2 step process:
            // 1) reformat reply such that we can search the buses by name in a dict.
            // 2) iterate through buses in our bus stop objects and retrieve the timings based on the name.
            const shuttles = NUSReply.ShuttleServiceResult.shuttles.reduce((acc, shuttle) => {
              acc[shuttle.name] = shuttle;
              return acc;
            }, {});

            // ITERATE AND UPDATE BUS ARRIVAL TIMING
            for (let busObject of busStop.savedBuses) {
              const serviceName = busObject.busNumber;
              if (shuttles[serviceName]) {
                const shuttle = shuttles[serviceName];
                if (shuttle._etas) {
                  // These are NUS buses. Public buses do not have ._etas field in NUSNextBus API response.
                  // Handle the cases of differing sizes of etas returned due to 0/1/2 next buses.
                  // ETA is not given in ISO time, so we have to calculate the ISO time based on mins till arrival.
                  const etaLength = shuttle._etas.length;
                  const currentTime = new Date();
                  if (etaLength == 0) {
                    busObject.timings = ["N.A.", "N.A."];
                  } else if (etaLength == 1) {
                    const arrivalTime = shuttle._etas[0].eta_s;
                    const firstArrivalTime = new Date(currentTime.getTime() + arrivalTime * 1000).toISOString();
                    busObject.timings = [firstArrivalTime, "N.A."];
                  } else {
                    const arrivalTime = shuttle._etas[0].eta_s;
                    const nextArrivalTime = shuttle._etas[1].eta_s;
                    const firstArrivalTime = new Date(currentTime.getTime() + arrivalTime * 1000).toISOString();
                    const secondArrivalTime = new Date(currentTime.getTime() + nextArrivalTime * 1000).toISOString();
                    busObject.timings = [firstArrivalTime, secondArrivalTime];
                    busStop.busNumber = shuttle.caption; // Update NUS Bus Stop name to be the full name rather than the code name (i.e. YIH-OPP -> Opp Yusof Ishak House).
                  }
                } else {
                  // Public bus timings obtained by NUSNextBus API is given in mins to arrival rather than ISO time.
                  // The code below converts arrival time in minutes to ISO time to maintain a standard response format.
                  const currentTime = new Date();
                  let arrivalTime = shuttles[serviceName].arrivalTime;
                  let nextArrivalTime = shuttles[serviceName].nextArrivalTime;

                  // Check if arrivalTime and nextArrivalTime are numbers (they can be Arr), if not, set them to 0
                  arrivalTime = isNaN(arrivalTime) ? 0 : arrivalTime;
                  nextArrivalTime = isNaN(nextArrivalTime) ? 0 : nextArrivalTime;

                  const firstArrivalTime = new Date(currentTime.getTime() + arrivalTime * 60000).toISOString();
                  const secondArrivalTime = new Date(currentTime.getTime() + nextArrivalTime * 60000).toISOString();

                  busObject.timings = [firstArrivalTime, secondArrivalTime];
                }
              }
            }
            // Update NUS Bus Stop name to be the full name rather than the code name (i.e. NUSSTOP_YIH-OPP -> NUSSTOP_Opp Yusof Ishak House).
            busStop.busStopName = "NUSSTOP_" + NUSReply.ShuttleServiceResult.caption;
            cache.set(cacheKey, busStop.savedBuses, 30); // cache for 30 seconds
          } catch (error) {
            console.error("Error fetching data from NUSNextBus API:", error);
          }
        }
      } else {
        await Promise.all(
          busStop.savedBuses.map(async (bus) => {
            const cacheKey = `LTA_${busStop.busStopId}_${bus.busNumber}`;
            const cachedData = cache.get(cacheKey);

            if (cachedData) {
              bus.timings = cachedData;
            } else {
              // logic is somewhat convoluted here, can be simplified by removing serviceNo to reduce the number of API calls.
              // though that will require some gymnastics with inserting the timings (need to match serviceNo etc).
              // Also, if we simply call the API by bus stop id, certain bus services will be missing because the api only responses for certain bus stops.
              try {
                const response = await axios.get(
                  `http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=${busStop.busStopId}&ServiceNo=${bus.busNumber}`,
                  {
                    headers: {
                      AccountKey: process.env.LTA_DATAMALL_KEY,
                    },
                  }
                );

                if (response.status !== 200) {
                  throw new Error(`HTTP error from datamall! status: ${response.status}`);
                }

                if (!response.data) {
                  throw new Error("Empty response body from datamall");
                }

                const datamallReply = response.data;
                if (!datamallReply.Services) {
                  throw new Error("Unexpected response format from datamall");
                }
                if (datamallReply.Services.length === 0) {
                  bus.timings = ["N.A.", "N.A."];
                } else {
                  const firstArrivalTime = datamallReply.Services[0].NextBus.EstimatedArrival;
                  const secondArrivalTime = datamallReply.Services[0].NextBus2.EstimatedArrival;
                  bus.timings = [firstArrivalTime, secondArrivalTime];
                  cache.set(cacheKey, bus.timings, 30); // Cache for 30 seconds
                }
              } catch (error) {
                console.error("Error fetching data from datamall:", error);
              }
            }
          })
        );
      }
    })
  );
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
    const busStopsArray = await getNearestBusStops(latitude, longitude);
    await getArrivalTime(busStopsArray); // insert arrival times
    res.json(busStopsArray);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
