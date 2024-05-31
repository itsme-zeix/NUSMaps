const dotenv = require("dotenv").config();
const express = require("express");
const router = express.Router();

async function getArrivalTime(busStopsArray) {
  for (const busStop of busStopsArray) {
    for (const bus of busStop.savedBus) {
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
            throw new Error("Empty response body");
          }

          const datamallReply = JSON.parse(text);
          if (!datamallReply.Services || !datamallReply.Services[0]) {
            throw new Error("Unexpected response format");
          }

          const firstArrivalTime =
            datamallReply.Services[0].NextBus.EstimatedArrival;
          const secondArrivalTime =
            datamallReply.Services[0].NextBus2.EstimatedArrival;
          bus.timings = [firstArrivalTime, secondArrivalTime];
          // console.log(bus);
          // console.log(JSON.stringify(busStopsArray));
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      })(busStop.id, bus.busNumber);
    }
  }
}

// // Example usage
// const busStopsArray = [
//   {
//     id: "43009",
//     savedBus: [
//       { busNumber: "106", timings: [] },
//       { busNumber: "852", timings: [] },
//     ],
//   },
// ];
// getArrivalTime(busStopsArray);

/* GET busArrivalTimes at the list of bus stops */
router.post("/busArrivaltimes", async (req, res) => {
  const acceptHeader = req.get("Accept");
  const authorizationHeader = req.get("Authorization");
  const contentTypeHeader = req.get("content-type");
  const busStopsArray = req.body;

  if (contentTypeHeader !== "application/json") {
    return res.status(415).send("Unsupported Media Type");
  }

  if (acceptHeader !== "application/json") {
    return res.status(406).send("Not Acceptable");
  }

  // Add authorization check!!!

  // Function call to query datamall API and return processed json
  try {
    await getArrivalTime(busStopsArray);
    res.json(busStopsArray); // sends the json as response
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
