const { format } = require("date-fns");
const dotenv = require("dotenv").config();
var express = require("express");
var polyline = require("@mapbox/polyline");
const turf = require("@turf/turf");
const fs = require("fs");
const axios = require("axios");

var router = express.Router();
const NUSNEXTBUSCREDENTIALS = Buffer.from(
  `${process.env.NUSNEXTBUS_USER}:${process.env.NUSNEXTBUS_PASSWORD}`
).toString('base64');
const ONEMAPAPIKEY = process.env.ONEMAPAPIKEY;
const ONEMAPAPITOKEN = process.env.ONEMAPAPITOKEN;

const PUBLICNUSBUSSTOPS = [
  "CG",
  "JP-SCH-16151",
  "RAFFLES",
  "MUSEUM",
  "YIH-OPP",
  "YIH",
  "SDE3-OPP",
  "UHC",
  "UHC-OPP",
  "IT",
  "CLB",
  "UHALL-OPP",
  "UHALL",
  "S17",
  "LT27",
  "KRB",
  "KR-MRT",
  "KR-MRT-OPP",
];

let TEMP_NUS_BUS_STOPS_COORDS = null;

const populateNusStops = async () => {
  if (!TEMP_NUS_BUS_STOPS_COORDS) {
    TEMP_NUS_BUS_STOPS_COORDS = new Map();
    const result = await axios.get("https://nnextbus.nus.edu.sg/BusStops", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${NUSNEXTBUSCREDENTIALS}`,
      },
    });
    const busStops = result.data.BusStopsResult.busstops;
    for (const busStop of busStops) {
      TEMP_NUS_BUS_STOPS_COORDS.set(busStop.name, {
        latitude: busStop.latitude,
        longitude: busStop.longitude,
      }); 
    }
  };
};



const NUS_main_campus = turf.polygon([
    [
      [1.3005628657892387, 103.77832943343063], //coords of nus given by google maps
      [1.3023124806584663, 103.77473563267986], // coords of nus north
      [1.3025750928275155, 103.7711089390613], //coords of north-west
      [1.3029190771254466, 103.76849448593353], //north-east of main campus
      [1.30216730286252, 103.76710223379818], //north-east-east
      [1.301029631597137, 103.76739051821554],
      [1.3010144626434559, 103.7688015945741],
      [1.300536417289922, 103.76964283355146],
      [1.298952, 103.769564],
      [1.293469, 103.768632],
      [1.2932377594265212, 103.76877142619047],
      [1.2924306202942022, 103.77046025348741],
      [1.292206638078851, 103.77159838628117],
      [1.2923802329646688, 103.77242062668698],
      [1.291690121858906, 103.77367665227003], //southern points
      [1.2910324689351864, 103.77504439393819],
      [1.2903455529876475, 103.7787362464226],
      [1.2889226067082815, 103.78303725651844],
      [1.292913859485185, 103.78532774020009],
      [1.2938082138904348, 103.78552872515404], //west
      [1.294416174451289, 103.7862503760527],
      [1.298486828084511, 103.78237294783986],
      [1.3005628657892387, 103.77832943343063],
    ],
  ]);

const UTOWN = turf.polygon([
    [
      [1.3038122291526468, 103.77261610335879], //south-west
      [1.3044184078463275, 103.77168571218175],
      [1.3047633767756952, 103.77152673208596],
      [1.3054996128364094, 103.77131746819157],
      [1.3093443263822075, 103.77193220431806], //north-west
      [1.3089503110991403, 103.77278419275714], //north
      [1.3088517890174955, 103.77359592571669],
      [1.305861823817989, 103.77498878763893],
      [1.3043228861440457, 103.77527031146018],
      [1.303746474239734, 103.77615390341342],
      [1.3025351374545597, 103.77482242792516],
      [1.3034875179531693, 103.77311620058559], //south
      [1.3038122291526468, 103.77261610335879],
    ],
  ]);

const BUKITTIMAHCAMPUS = turf.polygon([
    [
      [1.3199857761667493, 103.81772502068209], // northern tip
      [1.3188668036342386, 103.81628748746567], //western tip
      [1.3183531088631435, 103.8164589866481], //southern tip
      [1.3180340104667796, 103.81668697440577],
      [1.3178480668629782, 103.81703167772963],
      [1.317897387153247, 103.81727988670823],
      [1.3182812769107988, 103.81775673592597], //eastern tip
      [1.3190201017319494, 103.81852882870939],
      [1.3199857761667493, 103.81772502068209],
    ],
  ]);

function _sortByDuration(firstItinerary, secondItinerary) {
    return firstItinerary.duration - secondItinerary.duration;
};

function _processItinerary(itinerary) {
  console.log('itinerary:', itinerary);
  const legsArray = itinerary.legs;
  // console.log("legs array: ", legsArray);
  const [typesArr, formattedLegArray, combinedRouteGeometry, stopsCoordsArray] =
    formatLeg(legsArray);
  // console.log("types array: ", typesArr);
  // console.log("formattedLegArray: ", formattedLegArray);
  const rightSideTiming = formatBeginningEndingTime(
    itinerary.startTime,
    itinerary.endTime
  );
  const leftSideTiming = formatJourneyTime(itinerary.duration);
  // console.log("combine geometry: ", combinedRouteGeometry);
  return [
    typesArr,
    leftSideTiming,
    rightSideTiming,
    formattedLegArray,
    combinedRouteGeometry,
    stopsCoordsArray,
  ];
};

async function _processData(response) {
    /*processes the data and returns the following useful info:
    
    */
    // console.log("response: ", response);
    // console.log("response plan: ", response.plan);
    const bestPaths = response.plan.itineraries.filter((itinerary) => itinerary != undefined || itinerary != null);
    const baseCardResultsDataStorage = [];
    console.log("best paths: ", JSON.stringify(bestPaths));
    for (let index = 0; index < bestPaths.length; index++) {
      let currPath = bestPaths[index];
      // console.log(currPath.legs[0].mode);
      // Only way to not use 'any' type here is to define an interface for the const routes (the json reply above)
      console.log('current path: ', currPath);
      const [
        typesArr,
        leftSideTiming,
        rightSideTiming,
        formattedLegArray,
        combinedRouteGeometry,
        stopsCoordsArray,
      ] = _processItinerary(currPath);
  
      baseCardResultsDataStorage.push({
        types: typesArr,
        journeyTiming: leftSideTiming,
        wholeJourneyTiming: rightSideTiming,
        journeyLegs: formattedLegArray,
        polylineArray: combinedRouteGeometry,
        stopsCoordsArray: [...stopsCoordsArray],
      });
    }
    // console.log('finished :', baseCardResultsDataStorage);
    return baseCardResultsDataStorage;
};
const formatBeginningEndingTime = (startTiming, endTiming) => {
  const formattedStartTiming = format(new Date(startTiming), "hh:mm a");
  const formattedEndTiming = format(new Date(endTiming), "hh:mm a");
  return `${formattedStartTiming} - ${formattedEndTiming}`;
};

const formatJourneyTime = (time) => {
  const intermediate = Math.floor(time / 60);
  const hours = Math.floor(intermediate / 60);
  const minutes = Math.floor(intermediate % 60);
  return hours < 1 ? `${minutes} min` : `${hours} hrs ${minutes}min`;
};

const formatLeg = (legArray) => {
  const formattedLegArray = [];
  const typesArr = [];
  let geometryArr = [];
  const stopsCoordsArray = new Set();

  for (const leg of legArray) {
    stopsCoordsArray.add(
      JSON.stringify({ latitude: leg.from.lat, longitude: leg.from.lon, name: leg.from.name })
    );
    leg.mode === "WALK"
      ? formattedLegArray.push(formatWalkLeg(leg))
      : formattedLegArray.push(formatPublicTransportLeg(leg, stopsCoordsArray));
    stopsCoordsArray.add(
      JSON.stringify({ latitude: leg.to.lat, longitude: leg.to.lon, name: leg.to.name })
    );
    typesArr.push(leg.mode);
    geometryArr = geometryArr.concat(polyline.decode(leg.legGeometry.points));
  }
  const combinedRouteGeometryString = polyline.encode(geometryArr);
  return [typesArr, formattedLegArray, combinedRouteGeometryString, stopsCoordsArray];
};

const formatWalkLeg = (leg) => {
  const walkInfo = leg.steps.map(turn => ({
    distance: turn.distance,
    direction: turn.absoluteDirection,
  }));
  return {
    type: "WALK",
    startTime: leg.startTime,
    endTime: leg.endTime,
    duration: leg.duration,
    walkInfo: walkInfo,
    distance: leg.distance,
    startCoords: leg.from,
    destCoords: leg.to,
  };
};

const formatPublicTransportLeg = (leg, stopsCoordsArray) => {
  const intermediateStopNames = [];
  const intermediateStopGPSCoords = [];
  for (const stop of leg.intermediateStops) {
    intermediateStopNames.push(stop.name);
    intermediateStopGPSCoords.push({ latitude: stop.lat, longitude: stop.lon });
    stopsCoordsArray.add(
      JSON.stringify({ latitude: stop.lat, longitude: stop.lon, name: stop.name })
    );
  }
  return {
    type: leg.mode,
    startingStopETA: leg.from.ETA,
    startTime: leg.startTime,
    endTime: leg.endTime,
    serviceType: leg.route,
    startingStopName: leg.from.name,
    destinationStopName: leg.to.name,
    intermediateStopCount: leg.intermediateStops.length + 1,
    duration: leg.duration,
    intermediateStopNames: intermediateStopNames,
    intermediateStopGPSCoords: intermediateStopGPSCoords,
  };
};

const _combineNUSInternalAlgo_OneMapResult = (
  slicedFormattedFinalResult,
  oneMapResult,
  oneMapResultFirst
) => {
  const oneMapItinerary = oneMapResult.itineraries[0];
  const singularSlicedFormattedFinalResult = slicedFormattedFinalResult[0];
  const duration = oneMapItinerary.duration + singularSlicedFormattedFinalResult.duration;
  const walkTime = singularSlicedFormattedFinalResult.walkTime + oneMapItinerary.walkTime;
  const startTime = oneMapResultFirst
    ? oneMapItinerary.startTime
    : singularSlicedFormattedFinalResult.startTime;
  const endTime = oneMapResultFirst
    ? oneMapItinerary.endTime + singularSlicedFormattedFinalResult.duration * 1000
    : oneMapItinerary.endTime;
  const legsArray = oneMapResultFirst
    ? oneMapItinerary.legs.concat(singularSlicedFormattedFinalResult.legs)
    : singularSlicedFormattedFinalResult.legs.concat(oneMapItinerary.legs);

  return {
    duration: duration,
    startTime: startTime,
    endTime: endTime,
    walkTime: walkTime,
    legs: legsArray,
    debuggingResults: JSON.stringify({
      oneMap: oneMapItinerary.legs,
      NUS_RESULT: singularSlicedFormattedFinalResult.legs,
      FINAL: legsArray,
    }),
  };
};
const _addAlternativeRoutesToOneMap = (oneMapRoute, nusResult) => {
  // console.log("map route: ", oneMapRoute);
  // console.log("nus results body: ", nusResult.body);
  oneMapRoute.plan.itineraries = oneMapRoute.plan.itineraries.concat(
    nusResult.body
  );
  // fs.appendFileSync('debuggingResults.json', JSON.stringify(nusResult.body), 'utf-8')
  oneMapRoute.plan.itineraries =oneMapRoute.plan.itineraries.sort(_sortByDuration);
  // console.log("one map route sorted: ", JSON.stringify(oneMapRoute));
  return oneMapRoute;
};


const handleRouting = async (origin, destination) => {  
  const originTurfPoint = turf.point([origin.latitude, origin.longitude]);
  const destinationTurfPoint = turf.point([destination.latitude, destination.longitude]);
  const isOriginInNUS = isPointInNUSPolygons(originTurfPoint); //true or false
  const isDestInNUS = isPointInNUSPolygons(destinationTurfPoint); //true or false
  if (isOriginInNUS && isDestInNUS) {
    sendProgress(res, progress += 20);
    console.log("Code 1: Origin in NUS, Destination Not in NUS");
    const result = await axios.post(
      "https://nusmaps.onrender.com/NUSBusRoutes",
      { origin, destination },
      { headers: { "Content-Type": "application/json" } }
    );
    return { status: 200, message: "both points lie inside NUS", body: result.data.slicedFormattedFinalResult[0] };
  } else if (!isOriginInNUS &&
  isDestInNUS) {
    console.log("Code 2: Origin Not in NUS, Destination in NUS");
    const promisesArray = PUBLICNUSBUSSTOPS.map(nusStop => {
        const nusStopCoords = TEMP_NUS_BUS_STOPS_COORDS.get(nusStop);
        return [
        axios.get(`https://www.onemap.gov.sg/api/public/routingsvc/route?start=${origin.latitude},${origin.longitude}&end=${nusStopCoords.latitude},${nusStopCoords.longitude}&routeType=pt&date=${format(new Date(), "MM-dd-yyyy")}&time=${format(new Date(), "HH:MM:SS")}&mode=TRANSIT&maxWalkDistance=1000&numItineraries=1`, {
            headers: { Authorization: ONEMAPAPIKEY },
            }),
            axios.post(
                "https://nusmaps.onrender.com/NUSBusRoutes",
                { origin: nusStopCoords, destination },
                { headers: { "Content-Type": "application/json" } }
            ),
        ];
});
    const responsesArray = await Promise.all(
        promisesArray.map(array => Promise.all(array))
    );

    const responseBodiesArray = await Promise.all(
        responsesArray.map(async ([originToStopResp, stopToDestResp]) => {
            const [originToStopData, stopToDestData] = await Promise.all([
                originToStopResp.data,
                stopToDestResp.data,
            ]);
            return { originToStopData, stopToDestData };
        })
        );
    const newFinalArray = responseBodiesArray.flatMap(({ originToStopData, stopToDestData }) => {
      if (stopToDestData.slicedFormattedFinalResult.length) {
        return [_combineNUSInternalAlgo_OneMapResult(stopToDestData.slicedFormattedFinalResult, originToStopData.plan, true)];
      }
      return [];
    });
    newFinalArray.sort(_sortByDuration);
    const status = 201;
    const message = "The origin lies outside of NUS, while the destination lies inside NUS";
    return { status, message, body: newFinalArray.slice(0, 2) };
} else if (isOriginInNUS && !(isDestInNUS)) {
  console.log("Code 2: Origin Not in NUS, Destination in NUS");
  const promisesArray = PUBLICNUSBUSSTOPS.map(nusStop => {
      const nusStopCoords = TEMP_NUS_BUS_STOPS_COORDS.get(nusStop);
      return [
      axios.post(
              "https://nusmaps.onrender.com/NUSBusRoutes",
              { origin, destination:nusStopCoords },
              { headers: { "Content-Type": "application/json" } }
          ),
      axios.get(`https://www.onemap.gov.sg/api/public/routingsvc/route?start=${nusStopCoords.latitude},${nusStopCoords.longitude}&end=${destination.latitude},${destination.longitude}&routeType=pt&date=${format(new Date(), "MM-dd-yyyy")}&time=${format(new Date(), "HH:MM:SS")}&mode=TRANSIT&maxWalkDistance=1000&numItineraries=1`, {
          headers: { Authorization: ONEMAPAPIKEY },
          })
      ];
  });
  const responsesArray = await Promise.all(
      promisesArray.map(array => Promise.all(array))
  );
  const responseBodiesArray = await Promise.all(
      responsesArray.map(async ([originToStopResp, stopToDestResp]) => {
          const [originToStopData, stopToDestData] = await Promise.all([
              originToStopResp.data,
              stopToDestResp.data,
          ]);
          return { originToStopData, stopToDestData };
      })
  );
  const newFinalArray = responseBodiesArray.flatMap(({ originToStopData, stopToDestData }) => {
    if (originToStopData.slicedFormattedFinalResult.length) {
      return [_combineNUSInternalAlgo_OneMapResult(originToStopData.slicedFormattedFinalResult, stopToDestData.plan, false)];
    };
    return [];
  });
  newFinalArray.sort(_sortByDuration);
  const status = 202;
  const message = "The origin lies in NUS, while the destination lies outside";
  return {status, message, body: newFinalArray.slice(0,2)};
} else {
  console.log("Code 4: Both Origin and Destination lie outside of NUS");
  const status = 203;
  const message = "Both points do not lie inside NUS";
  return {status, message, body:undefined};
  };
};

const isPointInNUSPolygons = point => {
  return turf.booleanPointInPolygon(point, NUS_main_campus)
    || turf.booleanPointInPolygon(point, UTOWN)
    || turf.booleanPointInPolygon(point, BUKITTIMAHCAMPUS);
};

const populateNusStopsAndLog =  () => {
  populateNusStops().then(() => {
    console.log("Bus Stops To Coords hashtable loaded");
  })
  .catch((error) => {
    console.error("Error populating NUS stops:", error);
  });
};
populateNusStopsAndLog();
//set an interval to refresh the map of the bus stops to coords
setInterval(populateNusStopsAndLog, 24 * 60 * 60 * 1000);

router.post("/", async (req, res) => {
  const auth_token = req.headers["authorization"];
  if (auth_token !== ONEMAPAPITOKEN) {
    return res.status(403).send(`Incorrect or missing authorization token. Your token: ${auth_token}`);
  };
  const { origin, destination } = req.body;
  const date = format(new Date(), "MM-dd-yyyy");
  const time = format(new Date(), "HH:MM:SS");
  const routesUrl = `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${origin.latitude},${origin.longitude}&end=${destination.latitude},${destination.longitude}&routeType=pt&date=${date}&time=${time}&mode=TRANSIT&maxWalkDistance=1000&numItineraries=3`;
  const headers = { Authorization: ONEMAPAPIKEY };
  try {
    const routeResponsePromise = axios.get(routesUrl, { headers });
    const nusResultPromise = handleRouting(origin, destination);
    const [routeResponse, nusResult] = await Promise.all([routeResponsePromise, nusResultPromise]);
    const result = _processData(routeResponse.data);
    if ([200, 201, 202].includes(nusResult.status)) {
      const addedLeg = _addAlternativeRoutesToOneMap(routeResponse.data, nusResult);
      const finalCombinedResult = await _processData(addedLeg);
      return res.json(finalCombinedResult);
    }
    return res.json(await result);
  } catch (err) {
    console.error("Error:", err);
    return res.status(401).send("Error retrieving route.");
  }
});

module.exports = router;
