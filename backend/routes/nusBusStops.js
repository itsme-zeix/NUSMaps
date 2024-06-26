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
async function getNUSBusStops() {
  // Connect to PostgreSQL server

  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: true, // Note that this is required to connect to the Render server.
  });

  // Query for bus stops and filter out NUS Bus Stops
  try {
    await client.connect();
    const res = await client.query(
      "SELECT id, name, latitude, longitude, services FROM busstops"
    );
    const busStops = res.rows;
    const nearbyStops = busStops
      .map((stop) => {
        const name = stop.name;
        const services = stop.services;
        return { id: stop.id, name, distance, services };
      })
      .filter(stop.name.startsWith("NUSSTOP"));

    // Format the bus stops properly so that timings can be inserted easily once retrieved.
    const arrBusStops = [];
    for (stop of nearbyStops) {
      const busStopObject = await generateBusStopsObject(stop);
      arrBusStops.push(busStopObject);
    }
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

// Insert the arrival times (retrieved from API) into the bus stops array.
// Functionally the same as calling /busStopArrivalTimes, but we avoid calling the internal API, despite the abstraction, as it will mean that we have to wait
// for multiple calls to complete synchronously, increasing our API's response time.
async function getArrivalTime(busStopsArray) {
  for (const busStop of busStopsArray) {
    await (async (stopName) => {
      try {
        const username = process.env.NUSNEXTBUS_USER;
        const password = process.env.NUSNEXTBUS_PASSWORD;

        // Encode the credentials
        const credentials = `${username}:${password}`;
        const encodedCredentials = btoa(credentials);

        const response = await fetch(
          `https://nnextbus.nus.edu.sg/ShuttleService?busstopname=${stopName}`,
          {
            method: "GET",
            headers: {
              Authorization: `Basic ${encodedCredentials}`,
            },
          }
        );

        // Check if the response is ok and has a body
        if (!response.ok) {
          throw new Error(
            `HTTP error from NUSNextBus API! status: ${response.status}`
          );
        }

        const text = await response.text();
        if (!text) {
          throw new Error("Empty response body from NUSNextBus API");
        }

        const NUSReply = JSON.parse(text);
        console.log(NUSReply);
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
            if (shuttles[serviceName]._etas) {
              // These are NUS buses. Public buses do not have ._etas field in NUSNextBus API response.
              // Handle the cases of differing sizes of etas returned due to 0/1/2 next buses.
              // ETA is not given in ISO time, so we have to calculate the ISO time based on mins till arrival.
              const etaLength = shuttles[serviceName]._etas.length;
              const currentTime = new Date();
              if (etaLength == 0) {
                busObject.timings = ["N.A.", "N.A."];
              } else if (etaLength == 1) {
                const arrivalTime = shuttles[serviceName]._etas[0].eta_s;
                const firstArrivalTime = new Date(
                  currentTime.getTime() + arrivalTime * 1000
                ).toISOString();
                busObject.timings = [firstArrivalTime, "N.A."];
              } else {
                const arrivalTime = shuttles[serviceName]._etas[0].eta_s;
                const nextArrivalTime = shuttles[serviceName]._etas[1].eta_s;
                const firstArrivalTime = new Date(
                  currentTime.getTime() + arrivalTime * 1000
                ).toISOString();
                const secondArrivalTime = new Date(
                  currentTime.getTime() + nextArrivalTime * 1000
                ).toISOString();
                busObject.timings = [firstArrivalTime, secondArrivalTime];
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
      } catch (error) {
        console.error("Error fetching data from NUSNextBus API:", error);
      }
    })(busStop.busStopName.substring(8)); // substring(8) skips the first 8 characters 'NUSSTOP_'
  }
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
    (async () => {
      const busStopsArray = await getNUSBusStops;
      await getArrivalTime(busStopsArray); // insert arrival times
      res.json(busStopsArray);
      
    })();
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;