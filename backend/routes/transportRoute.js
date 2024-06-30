const { format } = require('date-fns');
const dotenv = require("dotenv").config();
var express = require("express");
var polyline = require("@mapbox/polyline");
const turf = require('@turf/turf');
const fs = require('fs');

var router = express.Router();
const NUSNEXTBUSCREDENTIALS = btoa(`${process.env.NUSNEXTBUS_USER}:${process.env.NUSNEXTBUS_PASSWORD}`);
const PUBLICNUSBUSSTOPS = ["CG", "JP-SCH-16151", "RAFFLES", "MUSEUM", "YIH-OPP", "YIH", "SDE3-OPP", "UHC", "UHC-OPP", "IT", "CLB", "UHALL-OPP", "UHALL", "S17", "LT27", "KRB", "KR-MRT", "KR-MRT-OPP"];
const TEMP_NUS_BUS_STOPS_COORDS = new Map();

const populateNusStops = async () => {
  let result = await fetch("https://nnextbus.nus.edu.sg/BusStops", {
      method: "GET",
      headers: {
          "Content-Type": "application/json",
          "Authorization" : `Basic ${NUSNEXTBUSCREDENTIALS}`
        //or use this for authorization when building Constants.expoConfig.extra.EXPO_PUBLIC_ONEMAPAPITOKEN
      },
  });
  result = await result.json();
  busStops = result.BusStopsResult.busstops;
  for (busStop of busStops) {
      TEMP_NUS_BUS_STOPS_COORDS.set(busStop.name, {"latitude": busStop.latitude, "longitude":busStop.longitude});
  };
  // console.log(NUS_STOPS);
};
//define NUS region
const NUS_main_campus = turf.polygon([[
  [1.2968329289865643, 103.7762916810378], //coords of nus given by google maps
  [1.3028648271298058, 103.77279374967891], // coords of nus north
  [1.2998219221911307, 103.77865023478752], //coords of north-west
  [1.3025513785650056, 103.77122359254473], //north-east of main campus
  [1.2937887904782797, 103.78548519721024], //north-east-east
  [1.293460326733752, 103.7852568188001],
  [1.293092957711561, 103.78495104698392],
  [1.2925704299803888, 103.78444102681647],
  [1.2916901628460273, 103.78352141272447],
  [1.2900224844954917, 103.78182641051126],
  [1.2899700010610378, 103.78051232327127],
  [1.2901753809383811, 103.77798170130043],
  [1.2907355801595615, 103.77660936614296],
  [1.2910492008762349, 103.77500337319907],
  [1.2912820648270722, 103.77426779760573],//southern points
  [1.2914914567096643, 103.7736659358387],
  [1.2921567927024897, 103.77387489779053],
  [1.2927199359109969, 103.76837530764206],
  [1.2949161066970192, 103.76912561825506],
  [1.2992924248059339, 103.76957045591979], //west
  [1.3009729212012877, 103.7697122492112],
  [1.302843406171479, 103.77076362904104],
  [1.2968329289865643, 103.7762916810378],
]]);

const UTOWN = turf.polygon([[
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
  [1.3038122291526468, 103.77261610335879]
]]);

const BUKITTIMAHCAMPUS = turf.polygon([[
  [1.3199857761667493, 103.81772502068209],// northern tip
  [1.3188668036342386, 103.81628748746567], //western tip
  [1.3183531088631435, 103.8164589866481], //southern tip
  [1.3180340104667796, 103.81668697440577],
  [1.3178480668629782, 103.81703167772963],
  [1.317897387153247, 103.81727988670823],
  [1.3182812769107988, 103.81775673592597], //eastern tip
  [1.3190201017319494, 103.81852882870939],
  [1.3199857761667493, 103.81772502068209]
]]);

function _processItinerary(itinerary) {
  const legsArray = itinerary.legs;
  // console.log('itinerary:', itinerary);
    // console.log("legs array: ", legsArray);
  const [typesArr, formattedLegArray, combinedRouteGeometry, stopsCoordsArray] = formatLeg(legsArray);
  // console.log("types array: ", typesArr);
  // console.log("formattedLegArray: ", formattedLegArray);
  const rightSideTiming = formatBeginningEndingTime(
    itinerary.startTime,
    itinerary.endTime
  );
  const leftSideTiming = formatJourneyTime(itinerary.duration);
  // console.log("combine geometry: ", combinedRouteGeometry);
  return [typesArr,leftSideTiming, rightSideTiming, formattedLegArray, combinedRouteGeometry, stopsCoordsArray];
};
async function _processData(response) {
  /*processes the data and returns the following useful info:
  
  */
  // console.log("response: ", response);
  // console.log("response plan: ", response.plan);
  console.log(response.plan);
  const bestPaths = response.plan.itineraries;
  const baseCardResultsDataStorage = [];
  // console.log("best paths: ", JSON.stringify(bestPaths));
  for (let index = 0; index < bestPaths.length; index++) {
    let currPath = bestPaths[index];
    // console.log(currPath.legs[0].mode);
    // Only way to not use 'any' type here is to define an interface for the const routes (the json reply above)
    // console.log('current path: ', currPath);
    const [typesArr,leftSideTiming, rightSideTiming, formattedLegArray, combinedRouteGeometry, stopsCoordsArray] = _processItinerary(currPath);
    // console.log("stopsCoordsArray", stopsCoordsArray);

    baseCardResultsDataStorage.push({
      types: typesArr,
      journeyTiming: leftSideTiming,
      wholeJourneyTiming: rightSideTiming,
      journeyLegs: formattedLegArray,
      polylineArray: combinedRouteGeometry,
      stopsCoordsArray: [...stopsCoordsArray]
    });
  }
  // console.log('finished :', baseCardResultsDataStorage);
  return baseCardResultsDataStorage;
};

const formatBeginningEndingTime = (
  startTiming,
  endTiming
) => {
  console.log("end timing: ", endTiming);
  const formattedStartTiming = format(new Date(startTiming), "hh:mm a");
  const formattedEndTiming = format(new Date(endTiming), "hh:mm a");
  return `${formattedStartTiming} - ${formattedEndTiming}`;
};
console.log(format(new Date(1719671949000), "hh:mm a"));
const formatJourneyTime = (time) => {
  console.log(time);
  const intermediate = Math.floor(time / 60);
  const hours = Math.floor(intermediate / 60);
  const minutes = Math.floor(intermediate % 60);
  if (hours < 1) {
    return `${minutes} min`;
  }
  return `${hours} hrs ${minutes}min `;
  //weird visual bug
};

const formatLeg = (legArray) => {
  //general function to format legs, which consists of 3 distinct types, start intermediate, destination
  //and 4 distinct subtypes for intermediate: 
  //walk, bus, mrt, tram
  // console.log("received leg array ", legArray);
  //for walking there is only route geometry
  const formattedLegArray = [];
  const typesArr = [];
  let geometryArr = [];
  const stopsCoordsArray = new Set();
  // console.log('legarray: ', legArray);
  for (leg of legArray) {
    stopsCoordsArray.add(JSON.stringify({
      latitude: leg.from.lat,
      longitude: leg.from.lon,
      name: leg.from.name
    }));
    leg.mode === "WALK" ?  formattedLegArray.push(formatWalkLeg(leg)) : formattedLegArray.push(formatPublicTransportLeg(leg, stopsCoordsArray));
    stopsCoordsArray.add(JSON.stringify({
      latitude:leg.to.lat,
      longitude:leg.to.lon,
      name: leg.to.name
    }));
    typesArr.push(leg.mode);
    // console.log("leg geometry:",leg.legGeometry);
    const decodedArray = polyline.decode(leg.legGeometry.points);
    console.log(decodedArray);
    geometryArr = geometryArr.concat((polyline.decode(leg.legGeometry.points))); //returns an array which is then placed into an array
  };
  // console.log("geometry array:", geometryArr);
  // console.log("typesArr before sending: ", typesArr);
  const combinedRouteGeometryString = polyline.encode(geometryArr);
  // console.log("returned total route geometry: ",combinedRouteGeometryString);
  return [typesArr, formattedLegArray, combinedRouteGeometryString, stopsCoordsArray];
};

const formatWalkLeg = (leg) => {
  //assumption that there are no intermediate stops
  const stepsArr = leg.steps;
  const walkInfo = []; // json of dist and direction
  for (const turn of stepsArr) {
    walkInfo.push({
      "distance":turn.distance,
      "direction":turn.absoluteDirection
    });
  };
  return {
    type: "WALK",
    startTime: leg.startTime,
    endTime: leg.endTime,
    duration: leg.duration,
    walkInfo: walkInfo,
  };
};

const formatPublicTransportLeg = (leg, stopsCoordsArray) => {
  const startingStopName = leg.from.name;
  const destinationStopName = leg.to.name;
  const startingStopETA = leg.from.ETA; //will be undefined for public transport but defined for nus buses
  let intermediateStopCount = 1;
  const duration = leg.duration;//in minutes
  const intermediateStopNames = [];
  const intermediateStopGPSCoords = []; // json array
  for (stop of leg.intermediateStops) {
    intermediateStopNames.push(stop.name);
    intermediateStopGPSCoords.push({
      latitude: stop.lat,
      longitude: stop.lon,
    });
    stopsCoordsArray.add(JSON.stringify({
      latitude: stop.lat,
      longitude: stop.lon,
      name: stop.name
    }));
    intermediateStopCount += 1;
  };
  // console.log('pt leg completed');
  // console.log('intermediate stop count: ', intermediateStopCount);
  item = {
    type:leg.mode,
    startingStopETA: startingStopETA,
    startTime: leg.startTime,
    endTime: leg.endTime,
    serviceType: leg.route, //could be the bus number or the train
    startingStopName: startingStopName,
    destinationStopName: destinationStopName,
    intermediateStopCount: intermediateStopCount,
    duration: duration,
    intermediateStopNames: intermediateStopNames,
    intermediateStopGPSCoords: intermediateStopGPSCoords,
  };
  // console.log("item: ", item);
  return item;
};
// const _combineEncodedPolyLine = (firstString, secondString) => {
//   const combinedPointsArr = polyline.decode(firstString).concat(polyline.decode(secondString));
//   return polyline.encode(combinedPointsArr);
// };
const _combineNUSInternalAlgo_OneMapResult = (slicedFormattedFinalResult, oneMapResult, oneMapResultFirst) => {
  //combining both's first result only, can iterate and add the second option for more variety later
  const oneMapItinerary = oneMapResult.itineraries[0];
  const singularSlicedFormattedFinalResult = slicedFormattedFinalResult[0];
  const duration = oneMapItinerary.duration + singularSlicedFormattedFinalResult.duration;
  const walkTime = singularSlicedFormattedFinalResult.walkTime + oneMapItinerary.walkTime;
  let startTime;
  let endTime;
  let legsArray;
  // let finalPolyLineString;
  if (oneMapResultFirst) {
    startTime = oneMapItinerary.startTime;
    console.log("start time: ", startTime);
    endTime = oneMapItinerary.startTime + singularSlicedFormattedFinalResult.duration * 1000;
    legsArray = oneMapItinerary.legs.concat(singularSlicedFormattedFinalResult.legs);
    // finalPolyLineString = _combineEncodedPolyLine(oneMapItinerary.legGeometry.points, singularSlicedFormattedFinalResult.legGeometry.points);
  } else {
    startTime = singularSlicedFormattedFinalResult.startTime;
    endTime = oneMapItinerary.endTime;
    legsArray = singularSlicedFormattedFinalResult.legs.concat(oneMapItinerary.legs);
    // finalPolyLineString = _combineEncodedPolyLine(singularSlicedFormattedFinalResult.legGeometry.points, oneMapItinerary.legGeometry.points);
  };
  // console.log("singular result: ", singularSlicedFormattedFinalResult);
  // console.log("endTime from oneMap: ", oneMapItinerary.endTime);
  // console.log("endTime: ", endTime);
  return {
    duration: duration,
    startTime: startTime,
    endTime: endTime,
    walkTime: walkTime,
    legs: legsArray,
  };
};

const _sortBasedOnTotalDuration = (firstPlan, secondPlan) => {
  return firstPlan.duration - secondPlan.duration;
};

const checkCoords = async (origin, destination) => {
  //ALWAYS add this to results returned by onemap and compare
  const dateObject = new Date();
  await populateNusStops();
  const originTurfPoint = turf.point([origin.latitude, origin.longitude]);
  const destinationTurfPoint = turf.point([destination.latitude, destination.longitude]);
  const headers = {
    Authorization: process.env.ONEMAPAPIKEY
  };
  // console.log("origin: ", origin);
  // console.log("destination: ", destination);
  if (isPointInNUSPolygons(originTurfPoint) && isPointInNUSPolygons(destinationTurfPoint)) {
    //can use directly as result
    const resultPromise =  await fetch("https://test-nusmaps.onrender.com/NUSBusRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "origin": origin,
        "destination" : destination
      })
    }); //shows top 3 results 
    const result = await resultPromise.json();
    // console.log("result:", result);
    return {
      status: 200,
      message: "both points lie inside NUS",
      body: result.slicedFormattedFinalResult.slice(0,2)
    };
  } else if (!(isPointInNUSPolygons(originTurfPoint)) && isPointInNUSPolygons(destinationTurfPoint)) {
    //now we use onemaps to link to all possible public bus stops and then from all possible bus stops to the destination
    //we also compute the path from the public nus bus stop to the destination by walking
    const promisesArray = []; //a 2d array of promises like [[Promise<Origin, nus_stop>, Promise<nus_stop, destination>]...]
    for (nusStop of PUBLICNUSBUSSTOPS) {
      const nusStopCoords = TEMP_NUS_BUS_STOPS_COORDS.get(nusStop);
      // console.log("nus stop: ", nusStop);
      // console.log("nus stop coords: ", nusStopCoords);
      // console.log('destination:', destination);
      const promiseFromStopToDest = fetch("https://test-nusmaps.onrender.com/NUSBusRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "origin": nusStopCoords,
          "destination" : destination
        })
      });
      let date = format(dateObject, "MM-dd-yyyy");
      let time = format(dateObject, "HH:MM:SS");
      const routesUrl = encodeURI(
        `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${origin.latitude},${origin.longitude}&end=${nusStopCoords.latitude},${nusStopCoords.longitude}&routeType=pt&date=${date}&time=${time}&mode=TRANSIT&maxWalkDistance=1000&numItineraries=1`
      );
      const promiseFromOriginToStop = fetch(routesUrl, {
        method: "GET",
        headers: headers,
      });
      promisesArray.push([promiseFromOriginToStop, promiseFromStopToDest]);
    };
    const responsesArray = await Promise.all(promisesArray.map(array => Promise.all(array)));
    const jsonPromisesArray = responsesArray.map(responses =>
      Promise.all(responses.map(response => {
        // console.log("Response status:", response.status);
        // console.log("Response status text:", response.statusText);
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        } else {
          return response.json();
        }})));
    const responseBodiesArray = await Promise.all(jsonPromisesArray);
    console.log("all: ", responseBodiesArray);
    const newFinalArray = [];
    for (body of responseBodiesArray) {
      console.log("formatted result: ", JSON.stringify(body[1].slicedFormattedFinalResult));
      console.log("itinerary: ", JSON.stringify(body[0].plan.itineraries[0].duration));
      if (body[1].slicedFormattedFinalResult.length !== 0) {
        console.log("result: ", JSON.stringify(_combineNUSInternalAlgo_OneMapResult(body[1].slicedFormattedFinalResult, body[0].plan, true)));
        newFinalArray.push(_combineNUSInternalAlgo_OneMapResult(body[1].slicedFormattedFinalResult, body[0].plan, true));
      }
    };
    console.log("new final array pre sorting: ", JSON.stringify(newFinalArray));
    newFinalArray.sort(_sortBasedOnTotalDuration);
    console.log("sorted by timing",  JSON.stringify(newFinalArray));
    return {
      status: 201,
      message: "The origin lies outside of NUS, while the destination lies inside NUS",
      body: newFinalArray.slice(0, 2) //only show the top 3 results
      };
  } else if ( isPointInNUSPolygons(originTurfPoint) && !(isPointInNUSPolygons(destinationTurfPoint))) {
    //origin is in nus, destination lies outside
    const promisesArray = [];
    for (nusStop of PUBLICNUSBUSSTOPS) {
      const nusStopCoords = TEMP_NUS_BUS_STOPS_COORDS.get(nusStop);
      const promiseFromOriginToStop = fetch("https://test-nusmaps.onrender.com/NUSBusRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "origin": origin,
          "destination" : nusStopCoords
        })
      });
      let date = format(dateObject, "MM-dd-yyyy");
      let time = format(dateObject, "HH:MM:SS");
      const routesUrl = encodeURI(
        `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${nusStopCoords.latitude},${nusStopCoords.longitude}&end=${destination.latitude},${destination.longitude}&routeType=pt&date=${date}&time=${time}&mode=TRANSIT&maxWalkDistance=1000&numItineraries=1`
      );
      const headers = {
        Authorization: process.env.ONEMAPAPIKEY
      };
      const promiseFromStopToDest = fetch(routesUrl, {
        method: "GET",
        headers: headers,
      });
      promisesArray.push([promiseFromOriginToStop, promiseFromStopToDest]);
    }
    const responsesArray = await Promise.all(promisesArray.map(array => Promise.all(array)));
    const jsonPromisesArray = responsesArray.map(responses =>
      Promise.all(responses.map(response => {
        console.log("Response status:", response.status);
        console.log("Response status text:", response.statusText);

        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        } else {
          return response.json();
        }})));
    const responseBodiesArray = await Promise.all(jsonPromisesArray);
    console.log("all: ", responseBodiesArray);
    const newFinalArray = [];
    for (body of responseBodiesArray) {
      console.log("formatted result: ", body[1].plan);
      console.log("itinerary: ", body[0].slicedFormattedFinalResult);
      if (body[0].slicedFormattedFinalResult.length !== 0) {
        console.log("code 3");
        console.log("result: ", JSON.stringify(_combineNUSInternalAlgo_OneMapResult(body[0].slicedFormattedFinalResult, body[1].plan, false)));
        newFinalArray.push(_combineNUSInternalAlgo_OneMapResult(body[0].slicedFormattedFinalResult, body[1].plan, false));
      };
    };
    newFinalArray.sort(_sortBasedOnTotalDuration);
    console.log("new final array", JSON.stringify(newFinalArray));
    // newFinalArray.sort();
    // console.log("sorted by timing", JSON.stringify(newFinalArray));
    return { 
      status: 202,
      message: "The origin lies in NUS, while the destination lies outside",
      body: newFinalArray.slice(0, 2)
    };
  } else {
    //both not inside, will return undefined
    return {
      status:203,
      message: "Both points do not lie inside NUS",
      body: undefined
    };
  }
};
const isPointInNUSPolygons = (point) => {
  return turf.booleanPointInPolygon(point, NUS_main_campus) || turf.booleanPointInPolygon(point, UTOWN) || turf.booleanPointInPolygon(point, BUKITTIMAHCAMPUS);
};

const _addAlternativeRoutesToOneMap = (oneMapRoute, nusResult) => {
  // console.log("map route: ", oneMapRoute);
  // console.log("nus results body: ", nusResult.body);
  oneMapRoute.plan.itineraries = oneMapRoute.plan.itineraries.concat(nusResult.body);
  oneMapRoute.plan.itineraries = oneMapRoute.plan.itineraries.sort((a, b) => {
    return a.duration < b.duration;
  });
  // console.log("one map route sorted: ", JSON.stringify(oneMapRoute));
  return oneMapRoute;
};

router.post("/", async (req, res) => {
    const dateObject = new Date();
    auth_token = req.headers['authorization'];
    console.log("Token received ", auth_token);
    let origin;
    let destination;
    if (auth_token === process.env.ONEMAPAPITOKEN) {
      origin = req.body.origin;
      destination = req.body.destination;
      let date = format(dateObject, "MM-dd-yyyy");
      let time = format(dateObject, "HH:MM:SS");
      const routesUrl = encodeURI(
        `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${origin.latitude},${origin.longitude}&end=${destination.latitude},${destination.longitude}&routeType=pt&date=${date}&time=${time}&mode=TRANSIT&maxWalkDistance=1000&numItineraries=3`
      );
      // console.log("routes url:", routesUrl);
      const headers = {
        Authorization: process.env.ONEMAPAPIKEY
      };
      try {
        const response = fetch(routesUrl, {
          method: "GET",
          headers: headers,
        });
        const routeResponse = await response;
        const route = await routeResponse.json();
        console.log("response route: ", route);
        const nusResultPromise = checkCoords(origin, destination); //this will decide the course of action
        console.log('nus result promise: ', nusResultPromise);
        const result = await _processData(route);
        const nusResult = await nusResultPromise;
        console.log("nus result body: ", JSON.stringify(nusResult));
        if (nusResult.status === 200 || nusResult.status === 201 || nusResult.status === 202) {
          const addedLeg = _addAlternativeRoutesToOneMap(route, nusResult);
          // console.log('added leg: ', JSON.stringify(addedLeg));
          const finalCombinedResult = await _processData(addedLeg);
          return res.json(finalCombinedResult);
        } else {
          return res.json(result);
        }
      } catch (err) {
        console.error(err); //log the error from "route not found"
        return res.status(401).send("Error retrieving route.");
      }
    } else {
      return res.status(403).send(`Incorrect or missing authorization token. Your token: ${auth_token}`);
    }
});

module.exports = router;
