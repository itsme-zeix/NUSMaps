var express = require("express");
var router = express.Router();

// Retrieve arrival info from datamall. To be migrated to database querying/read and write (caching).
function getArrivalTime(busStopCodes, serviceNos) {
  for (const busStopCode of busStopCodes) {
    for (const serviceNo of serviceNos) {
      async (busStopCode, serviceNo) => {
        const response = await fetch(
          "http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2",
          {
            method: "GET",
            headers: {
              AccountKey: "***REMOVED***",
              BusStopCode: busStopCode,
              ServiceNo: serviceNo,
            },
          }
        );
        const datamallReply = await response.json();
        print(datamallReply);
      };
    }
  }
}

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
