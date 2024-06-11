const dotenv = require("dotenv").config();
const express = require("express");
const router = express.Router();

async function getArrivalTime(busStopsArray) {
  for (const busStop of busStopsArray) {
    for (const bus of busStop.savedBuses) {
      await (async (stopId, serviceNo) => {
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
          if (!datamallReply.Services || !datamallReply.Services[0]) {
            throw new Error("Unexpected response format from datamall");
          }

          const firstArrivalTime =
            datamallReply.Services[0].NextBus.EstimatedArrival;
          const secondArrivalTime =
            datamallReply.Services[0].NextBus2.EstimatedArrival;
          bus.timings = [firstArrivalTime, secondArrivalTime];
          // console.log(bus);
          // console.log(JSON.stringify(busStopsArray));
        } catch (error) {
          console.error("Error fetching data from datamall:", error);
        }
      })(busStop.busStopId, bus.busNumber);
    }
  }
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
  const busStopsArray = req.body;

  console.log("Received POST /busArrivalTimes, body:", req.body);

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
    if (!Array.isArray(busStopsArray)) {
      throw new Error("Request body must be an array");
    }
    await getArrivalTime(busStopsArray);
    res.json(busStopsArray);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
