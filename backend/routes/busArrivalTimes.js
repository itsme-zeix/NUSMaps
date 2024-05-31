var express = require("express");
var router = express.Router();

// Retrieve arrival info from datamall. To be migrated to database querying/read and write (caching).
async function getArrivalTime(busStopCodes, serviceNos) {
  for (let i = 0; i < busStopCodes.length; i++) {
    for (const serviceNo of serviceNos[i]) {
      await (async (stop, bus) => {
        try {
          const response = await fetch(
            "http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=" +
              stop +
              "&ServiceNo=" +
              bus,
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
          return;
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      })(busStopCodes[i], serviceNo);
    }
  }
}

// Example usage
const busStopCodes = ["43009"];
const serviceNos = [["106", "852"]];
getArrivalTime(busStopCodes, serviceNos);

/* GET busArrivalTimes at the list of bus stops */
router.get("/busArrivaltimes", async (req, res) => {
  const acceptHeader = req.get("Accept");
  const authorizationHeader = req.get("Authorization");
  const contentTypeHeader = req.get("content-type");
  const busStopIds = req.get("Bus-Stop-Ids");
  const busNames = req.get("Bus-Names");

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

  const busStopIdsArray = busStopIds.split(",");
  const busNamesArray = busNames.split(",");

  // Function call to query datamall API and return processed json
  try {
    getArrivalTime(busStopIdsArray, busNamesArray);
    res.json(result.rows); // sends the json as response
  } catch (err) {
    console.error(err);
    res.status(500).send("Database query error");
  }
});

module.exports = router;
