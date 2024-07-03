const dotenv = require("dotenv").config();
const express = require("express");
const router = express.Router();

async function getArrivalTime(busStopsArray) {
  await Promise.all(
    busStopsArray.map(async (busStop) => {
      if (busStop.busStopName.startsWith("NUSSTOP")) {
        await (async (busStop) => {
          const stopName = busStop.busStopName.substring(8); // substring(8) skips the first 8 characters 'NUSSTOP_'
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
              console.log(serviceName);
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
                    const firstArrivalTime = new Date(
                      currentTime.getTime() + arrivalTime * 1000
                    ).toISOString();
                    busObject.timings = [firstArrivalTime, "N.A."];
                  } else {
                    const arrivalTime = shuttle._etas[0].eta_s;
                    const nextArrivalTime = shuttle._etas[1].eta_s;
                    const firstArrivalTime = new Date(
                      currentTime.getTime() + arrivalTime * 1000
                    ).toISOString();
                    const secondArrivalTime = new Date(
                      currentTime.getTime() + nextArrivalTime * 1000
                    ).toISOString();
                    busObject.timings = [firstArrivalTime, secondArrivalTime];
                    busStop.busStopName = shuttle.caption; // Update NUS Bus Stop name to be the full name rather than the code name (i.e. YIH-OPP -> Opp Yusof Ishak House).
                  }
                } else {
                  // Public bus timings obtained by NUSNextBus API is given in mins to arrival rather than ISO time.
                  // The code below converts arrival time in minutes to ISO time to maintain a standard response format.
                  const currentTime = new Date();
                  let arrivalTime = shuttles[serviceName].arrivalTime;
                  let nextArrivalTime = shuttles[serviceName].nextArrivalTime;

                  // Check if arrivalTime and nextArrivalTime are numbers (they can be Arr), if not, set them to 0
                  arrivalTime = isNaN(arrivalTime) ? 0 : arrivalTime;
                  nextArrivalTime = isNaN(nextArrivalTime)
                    ? 0
                    : nextArrivalTime;

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
            // Update NUS Bus Stop name to be the full name rather than the code name (i.e. NUSSTOP_YIH-OPP -> NUSSTOP_Opp Yusof Ishak House).
            busStop.busStopName =
              "NUSSTOP_" + NUSReply.ShuttleServiceResult.caption;
          } catch (error) {
            console.error("Error fetching data from NUSNextBus API:", error);
          }
        })(busStop);
      } else {
        await Promise.all(
          busStop.savedBuses.map(async (bus) => {
            // logic is somewhat convoluted here, can be simplified by removing serviceNo to reduce the number of API calls.
            // though that will require some gymnastics with inserting the timings (need to match serviceNo etc).
            // Also, if we simply call the API by bus stop id, certain bus services will be missing because the api only responses for certain bus stops.
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
                  throw new Error(
                    `HTTP error from datamall! status: ${response.status}`
                  );
                }

                const text = await response.text();
                if (!text) {
                  throw new Error("Empty response body from datamall");
                }

                const datamallReply = JSON.parse(text);
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
              } catch (error) {
                console.error("Error fetching data from datamall:", error);
              }
            })(busStop.busStopId, bus.busNumber);
          })
        );
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
    console.log(busStopsArray);
    console.log(busStopsArray[0].savedBuses[0]);
    res.json(busStopsArray);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
