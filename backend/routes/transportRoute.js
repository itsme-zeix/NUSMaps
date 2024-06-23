const { format } = require('date-fns');
const dotenv = require("dotenv").config();
var express = require("express");
var polyline = require("@mapbox/polyline");

var router = express.Router();
const PUBLICTRANSPORTTYPES = ["BUS", "MRT", "TRAM"];
async function _processData(response) {
  /*processes the data and returns the following useful info:
  
  */
  console.log("response: ", response);
  console.log("response plan: ", response.plan);
  const bestPaths = response.plan.itineraries;
  const baseCardResultsDataStorage = [];
  for (let index = 0; index < bestPaths.length; index++) {
    let currPath = bestPaths[index];
    // console.log(currPath.legs[0].mode);
    // Only way to not use 'any' type here is to define an interface for the const routes (the json reply above)
    const legsArray = currPath.legs;
    // console.log("legs array: ", legsArray);
    const [typesArr, formattedLegArray, combinedRouteGeometry] = formatLeg(legsArray);
    console.log("types array: ", typesArr);
    console.log("formattedLegArray: ", formattedLegArray);
    const rightSideTiming = formatBeginningEndingTime(
      currPath.startTime,
      currPath.endTime
    );
    const leftSideTiming = formatJourneyTime(currPath.duration);
    console.log("combine geometry: ", combinedRouteGeometry);
    baseCardResultsDataStorage.push({
      types: typesArr,
      journeyTiming: leftSideTiming,
      wholeJourneyTiming: rightSideTiming,
      journeyLegs: formattedLegArray,
      polylineArray: combinedRouteGeometry
    });
  }
  console.log('finished :', baseCardResultsDataStorage);
  return baseCardResultsDataStorage;
};

const decodePolyLine = (encodedInput) => {
  //takes in a string and converts it into points
  return polyline.decode(encodedInput.points);
};

const formatBeginningEndingTime = (
  startTiming,
  endTiming
) => {
  const formattedStartTiming = format(new Date(startTiming), "hh:mm a");
  const formattedEndTiming = format(new Date(endTiming), "hh:mm a");
  return `${formattedStartTiming} - ${formattedEndTiming}`;
};

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
  const geometryArr = [];
  for (leg of legArray) {
    leg.mode === "WALK" ?  formattedLegArray.push(formatWalkLeg(leg)) : formattedLegArray.push(formatPublicTransportLeg(leg));
    typesArr.push(leg.mode);
    console.log("leg geometry:",leg.legGeometry);
    geometryArr.push(decodePolyLine(leg.legGeometry)); //returns an array which is then placed into an array
  };
  console.log("typesArr before sending: ", typesArr);
  console.log("formatted leg array", formattedLegArray);
  const combinedRouteGeometry = geometryArr.flat(2);
  console.log("returned total route geometry: ",combinedRouteGeometry);
  return [typesArr, formattedLegArray, combinedRouteGeometry];
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
    walkInfo: walkInfo,
  };
};

const formatPublicTransportLeg = (leg) => {
  const startingStopName = leg.from.name;
  const destinationStopName = leg.to.name;
  let intermediateStopCount = 1;
  const totalTimeTaken = Math.ceil(leg.duration/60);//in minutes
  const intermediateStopNames = [];
  const intermediateStopGPSCoords = []; // json array
  for (stop of leg.intermediateStops) {
    intermediateStopNames.push(stop.name);
    intermediateStopGPSCoords.push({
      latitude: stop.lat,
      longitude: stop.lon,
    });
    intermediateStopCount += 1;
  };
  console.log('pt leg completed');
  console.log('intermediate stop count: ', intermediateStopCount);
  item = {
    type:leg.mode,
    serviceType: leg.route, //could be the bus number or the train
    startingStopName: startingStopName,
    destinationStopName: destinationStopName,
    intermediateStopCount: intermediateStopCount,
    totalTimeTaken: totalTimeTaken,
    intermediateStopNames: intermediateStopNames,
    intermediateStopGPSCoords: intermediateStopGPSCoords,
  };
  console.log("item: ", item);
  return item;
};



router.post("/", async (req, res) => {
    const dateObject = new Date();
    auth_token = req.headers['authorization'];
    console.log("Token received ", auth_token);
    let origin;
    let destination;
    if (auth_token === process.env.ONEMAPAPITOKEN) {
      origin = req.body.origin;
      console.log("origin received: ", origin);
      destination = req.body.destination;
      let date = format(dateObject, "MM-dd-yyyy");
      let time = format(dateObject, "HH:MM:SS");
      const routesUrl = encodeURI(
        `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${origin.latitude},${origin.longitude}&end=${destination.latitude},${destination.longitude}&routeType=pt&date=${date}&time=${time}&mode=TRANSIT&maxWalkDistance=1000&numItineraries=3`
      );
      console.log("routes url:", routesUrl);
      const headers = {
        Authorization: `${process.env.ONEMAPAPIKEY}`,
      };
      try {
        const response = await fetch(routesUrl, {
          method: "GET",
          headers: headers,
        });
        const route = await response.json();
        const result = await _processData(route);
        return res.json(result);
      } catch (err) {
        console.error(err); //log the error from "route not found"
        return res.status(401).send("Error retrieving route.");
      }
    } else {
      return res.status(403).send(`Incorrect or missing authorization token. Your token: ${auth_token}`);
    }
});

module.exports = router;
