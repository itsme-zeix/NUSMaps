const { format } = require('date-fns');
const dotenv = require("dotenv").config();
var express = require("express");

var router = express.Router();
const PUBLICTRANSPORTTYPES = ["BUS", "MRT", "TRAM"];
async function _processData(response) {
  /*processes the data and returns the following useful info:
  
  */
  const bestPaths = response.plan.itineraries;
  const baseCardResultsDataStorage = [];
  for (let index = 0; index < bestPaths.length; index++) {
    let currPath = bestPaths[index];
    // console.log(currPath.legs[0].mode);
    // Only way to not use 'any' type here is to define an interface for the const routes (the json reply above)
    const legsArray = currPath.legs;
    // console.log("legs array: ", legsArray);
    const [typesArr, formatted_legArray] = formatLeg(legsArray);
    console.log("types array: ", typesArr);
    console.log("formatted_legArray: ", formatted_legArray);
    const rightSideTiming = formatBeginningEndingTime(
      currPath.startTime,
      currPath.endTime
    );
    const leftSideTiming = formatJourneyTime(currPath.duration);
    baseCardResultsDataStorage.push({
      types: typesArr,
      journeyTiming: leftSideTiming,
      wholeJourneyTiming: rightSideTiming,
      journeyLegs: formattedLegsArray
    });
  }
  console.log('finished :', baseCardResultsDataStorage);
  return baseCardResultsDataStorage;
}

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
  const formatted_legArray = [];
  const typesArr = [];
  for (leg of legArray) {
    leg.mode === "WALK" ?  formatted_legArray.push(formatWalkLeg(leg)) : formatted_legArray.push(formatPublicTransportLeg(leg));
    typesArr.push(leg.mode);
  };
  console.log("typesArr before sending: ", typesArr);
  console.log("formatted leg array", formatted_legArray);
  return [typesArr, formatted_legArray];
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
  const intermediateStopCount = leg.numIntermediateStops;
  const totalTimeTaken = Math.ceil(leg.duration/60);//in minutes
  const intermediateStopNames = [];
  const intermediateStopGPSCoords = []; // json array
  for (stop of leg.intermediateStops) {
    intermediateStopNames.push(stop.name);
    intermediateStopGPSCoords.push({
      latitude: stop.lat,
      longitude: stop.lon,
    });
  };
  console.log('pt leg completed');
  return { //returns this json which has all the data needed to render one leg
    type:leg.mode,
    serviceType: leg.route, //could be the bus number or the train
    startingStopName: startingStopName,
    destinationStopName: destinationStopName,
    intermediateStopCount: intermediateStopCount,
    totalTimeTaken: totalTimeTaken,
    intermediateStopNames: intermediateStopNames,
    intermediateStopGPSCoords: intermediateStopGPSCoords,
  };
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
      const headers = {
        Authorization: `${process.env.ONEMAPAPIKEY}`,
      };
      try {
        const response = await fetch(routesUrl, {
          method: "GET",
          headers: headers,
        });
        const route = await response.json();
        return _processData(route);
      } catch (err) {
        console.error(err); //log the error from "route not found"
        return res.status(401).send("Error retrieving route.");
      }
    } else {
      return res.status(403).send(`Incorrect or missing authorization token. Your token: ${auth_token}`);
    }
});

module.exports = router;
