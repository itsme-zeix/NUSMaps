const express = require("express");
const router = express.Router();
app.use(express.json());

// Retrieve arrival info from datamall. To be migrated to database querying/read and write (caching).
async function getArrivalTime(busStopsArray) {
  for (const busStop of busStopsArray) {
    for (const bus of busStop.savedBus) {
      await (async (stopId, serviceNo) => {
        try {
          const response = await fetch(
            "http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=" +
              stopId +
              "&ServiceNo=" +
              serviceNo,
            {
              method: "GET",
              headers: {
                AccountKey: "***REMOVED***",
              },
            }
          );
          const datamallReply = await response.json();
          const firstArrivalTime =
            datamallReply.Services[0].NextBus.EstimatedArrival;
          const secondArrivalTime =
            datamallReply.Services[0].NextBus2.EstimatedArrival;
          bus.timings = [firstArrivalTime, secondArrivalTime];
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      })(busStop.id, bus.busNumber);
    }
  }
}

/* GET busArrivalTimes at the list of bus stops */
router.post("/busArrivaltimes", async (req, res) => {
  const acceptHeader = req.get("Accept");
  const authorizationHeader = req.get("Authorization");
  const contentTypeHeader = req.get("content-type");
  const busStopsArray = req.json({ requestBody: req.body });

  // Handle Content-Type for incoming request body
  let busArrivalTimes;
  if (contentTypeHeader !== "application/json") {
    return res.status(415).send("Unsupported Media Type");
  }

  // Handle Accept to determine response format
  if (acceptHeader !== "application/json") {
    res.status(406).send("Not Acceptable");
  }

  // Add authorization check!!!

  // Check for bus stop logic
  if (!busStopIds || !busNames) {
    return res
      .status(400)
      .send("Bus-Stop-Ids and Bus-Names headers are required");
  }

  // Function call to query datamall API and return processed json
  try {
    getArrivalTime(busStopsArray);
    res.json(result.rows); // sends the json as response
  } catch (err) {
    console.error(err);
    res.status(500).send("Database query error");
  }
});

module.exports = router;
