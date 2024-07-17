const dotenv = require("dotenv").config();
const express = require("express");
const router = express.Router();
const axios = require("axios");
const cache = require("./sharedmodules/cache");
const pool = require("./sharedmodules/dbPool");

// Haversine formula to calculate distance between two points
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers

  async function getArrivalTimeAndDistance(busStopsArray, userLat, userLon) {
    await Promise.all(
      busStopsArray.map(async (busStop) => {
        busStop.distanceAway = haversineDistance(busStop.latitude, busStop.longitude, userLat, userLon);
        if (busStop.busStopName.startsWith("NUSSTOP")) {
          await fetchNUSNextBusData(busStop);
        } else {
          await fetchLTAData(busStop);
        }
      })
    );
  }
}

async function fetchNUSNextBusData(busStop) {
  const stopName = busStop.busStopName.substring(8); // substring(8) skips the first 8 characters 'NUSSTOP_'
  const cacheKey = `arrivalTimes_${stopName}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    busStop.savedBuses = cachedData;
  } else {
    try {
      const username = process.env.NUSNEXTBUS_USER;
      const password = process.env.NUSNEXTBUS_PASSWORD;
      const credentials = `${username}:${password}`;
      const encodedCredentials = Buffer.from(credentials).toString("base64");
      const response = await axios.get(`https://nnextbus.nus.edu.sg/ShuttleService?busstopname=${stopName}`, {
        headers: {
          Authorization: `Basic ${encodedCredentials}`,
        },
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

      // REFORMAT
      let shuttles = {};
      for (let shuttle of NUSReply.ShuttleServiceResult.shuttles) {
        shuttles[shuttle.name] = shuttle;
      }
      // ITERATE AND UPDATE BUS ARRIVAL TIMING
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
              busStop.busStopName = shuttle.caption; // Update NUS Bus Stop name to be the full name rather than the code name (i.e. YIH-OPP -> Opp Yusof Ishak House).
            }
          } else {
            // Public bus timings obtained by NUSNextBus API is given in mins to arrival rather than ISO time.
            // The code below converts arrival time in minutes to ISO time to maintain a standard response format.
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
      cache.set(cacheKey, busStop.savedBuses, 15); // cache for 15 seconds
    } catch (error) {
      console.error("Error fetching data from NUSNextBus API:", error);
    }
  }
}

async function fetchLTAData(busStop) {
  await Promise.all(
    busStop.savedBuses.map(async (bus) => {
      const cacheKey = `LTA_${busStop.busStopId}_${bus.busNumber}`;
      const cachedData = cache.get(cacheKey);

      if (cachedData) {
        bus.timings = cachedData;
      } else {
        try {
          const response = await axios.get(
            `http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=${stopId}&ServiceNo=${serviceNo}`,
            {
              headers: {
                AccountKey: process.env.LTA_DATAMALL_KEY,
              },
            }
          );

          // Check if the response is ok and has a body
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
          if (datamallReply.Services.length == 0) {
            bus.timings = ["N.A.", "N.A."];
          } else {
            const firstArrivalTime = datamallReply.Services[0].NextBus.EstimatedArrival;
            const secondArrivalTime = datamallReply.Services[0].NextBus2.EstimatedArrival;
            bus.timings = [firstArrivalTime, secondArrivalTime];
            cache.set(cacheKey, bus.timings, 15); // Cache for 15 seconds
          }
        } catch (error) {
          console.error("Error fetching data from datamall:", error);
        }
      }
    })
  );
}

// // Example body
// const busStopsArray = [
//   {
//     id: "43009",
//     savedBus: [
//       { busNumber: "106", timings: [] },
//       { busNumber: "852", timings: [] },
//     ],
//   },
// ]

/* GET busArrivalTimes at the list of bus stops */
router.post("/", async (req, res) => {
  const acceptHeader = req.get("Accept");
  const authorizationHeader = req.get("Authorization");
  const contentTypeHeader = req.get("Content-Type");
  const busStopsArrayWithLocation = req.body;

  console.log("Received POST /busArrivalTimes");

  if (contentTypeHeader !== "application/json") {
    return res.status(415).send("Unsupported Media Type");
  }

  if (acceptHeader !== "application/json") {
    return res.status(406).send("Not Acceptable");
  }

  // Add authorization check
  // if (!authorizationHeader || authorizationHeader !== 'expectedValue') {
  //   return res.status(403).send("Forbidden");
  // }

  try {
    const busStopsArray = busStopsArrayWithLocation.favouriteBusStops;
    const userLat = busStopsArrayWithLocation.latitude;
    const userLon = busStopsArrayWithLocation.longitude;

    await getArrivalTimeAndDistance(busStopsArray, userLat, userLon);
    res.json(busStopsArray);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
