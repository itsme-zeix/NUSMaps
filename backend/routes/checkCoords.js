const express = require("express");
const polyline = require("@mapbox/polyline");
const router = express.Router();
const fs = require('fs');

const NO_OF_BUS_STOPS = 6;
const TEMP_NUS_SHUTTLES_ROUTES = new Map();
const TEMP_NUS_BUS_STOPS_COORDS = new Map();

const NUS_STOPS = [];

const NUS_SHUTTLE_ROUTES = [
    //LT13-OPP is ventus
    {"shuttle":"A1", "route": ["KRB", "LT13", "AS5", "BIZ2", "TCOMS-OPP", "PGP", "KR-MRT", "LT27", "UHALL", "UHC-OPP", "YIH", "CLB", "KRB"] // will always start and end in the same station, only count sequentially
    }, {"shuttle":"A2", "route":["KRB", "IT", "YIH-OPP", "MUSEUM", "UHC", "UHALL-OPP", "S17", "KR-MRT-OPP", "PGPR","TCOMS", "HSSML-OPP", "NUSS-OPP","LT13-OPP", "KRB"] 
    }, {"shuttle": "BTC", "route" : ["OTH", "BG-MRT", "KR-MRT", "LT27", "UHALL", "UHC-OPP", "UTOWN", "RAFFLES", "KV", "MUSEUM", "YIH", "CLB", "LT13", "AS5", "BIZ2", "PGP", "CG", "OTH"] 
    } , {"shuttle":"D1", "route": ["COM3", "HSSML-OPP", "NUSS-OPP", "LT13-OPP", "IT", "YIH-OPP", "MUSEUM", "UTOWN", "YIH", "CLB", "LT13", "AS5", "BIZ2", "COM3"] 
    }, {"shuttle":"D2", "route": ["COM3", "TCOMS-OPP", "PGP", "KR-MRT", "LT27", "UHALL", "UHC-OPP", "MUSEUM", "UTOWN", "UHC", "UHALL-OPP", "S17", "KR-MRT-OPP", "PGPR", "TCOMS", "COM3"] 
    }, {"shuttle":"K", "route": ["PGP", "KR-MRT", "LT27", "UHALL", "UHC-OPP","YIH", "CLB", "SDE3-OPP", "JP-SCH-16151", "KV", "MUSEUM", "UHC", "UHALL-OPP", "S17", "KR-MRT-OPP", "PGPR"] 
    }, {"shuttle":"L", "route": ["OTH", "BG-MRT", "CG", "OTH"]}];

const TEMP_SERVICE_CHECKPOINT_BUS_STOP_MAP = {
    "A1": [1, 71, 86, 138, 160, 208, 296, 349, 381, 414, 432, 466, 516],
    "A2":[1, 70, 96, 137, 178, 206, 236, 291, 373, 445, 474, 511, 549, 593],
    "BTC":[1, 41, 331, 354, 371, 387, 421, 461, 485, 507,524,540,558, 565,589, 953, 1000],
    "D1":[1, 25, 66, 105, 142, 168, 208, 254, 340, 373, 412, 427,479, 491],
    "D2":[1, 22, 71, 158, 210, 243, 276, 327, 372, 469, 498, 529, 585, 665, 727, 751],
    "K": [1, 88, 140, 173, 206, 224, 257, 311, 344, 380, 429, 471, 499, 529, 584, 681],
    "L":[1, 92, 166, 261],
};
//        const busLeg = getBusLeg(route, busTravelTime, originWalkingLeg.endTime, originBusStopCoords, destBustStopCoords);
const getBusLeg = (route, busTravelTime, startTime, originBusStopCoords, destBusStopCoords) => {
    const originStopIndex = route.originStopIndex;
    const destStopIndex = route.destStopIndex;
    const service = route.service;
    const intermediateStops = _extractIntermediateStopsArray(originStopIndex, destStopIndex, service, startTime);
    const polyline = _getEncodedPolyLine(originStopIndex, destStopIndex, service);
    const originBusStopDeparture = startTime + route.originServiceETA;
    console.log("polyline: ", polyine);
    return {
        startTime: startTime,
        endTime: startTime + busTravelTime * 1000,
        mode:"NUS_BUS",
        route: service,
        routeId: service,
        arrivalDelay: 0,
        from: {
            name:route.startStop,
            stopId: `${service}:${originStopIndex}`,
            lon: originBusStopCoords.longitude,
            lat: originBusStopCoords.latitude,
            arrival: startTime + route.originServiceETA,
            departure: originBusStopDeparture, //DEFAULT to 10s wait time
            vertexType: "TRANSIT"
        },
        to: {
            name: route.destStop,
            stopId: `${service}: ${destStopIndex}`,
            lon: destBusStopCoords.longitude,
            lat: destBusStopCoords.latitude,
            arrival: originBusStopDeparture + busTravelTime * 1000,
            departure: originBusStopDeparture + busTravelTime * 1000,
            vertexType: "TRANSIT",

        },
        legGeometry: {
            points: polyline,
        },
        routeShortName: service,
        routeLongName: `NUS SHUTTLE: ${service}`,
        rentedBike: false,
        transitLeg:true,
        duration: busTravelTime,
        intermediateStops: intermediateStops,
        fare: 0.00
    };
};
const _extractIntermediateStopsArray = (originStopIndex, destStopIndex, service, startTime) => {
    const routeArray = TEMP_NUS_SHUTTLES_ROUTES.get(service).route;
    let currTime = startTime;
    const intermediateStops = [];
    for (let index = originStopIndex + 1; index <= destStopIndex; index++) {
        const busStopName = routeArray[index];
        const currStopCoords = TEMP_NUS_BUS_STOPS_COORDS.get(busStopName);
        const singularStop = {
            name: routeArray[index],
            stopId: `${service}:${index}`,
            lon: currStopCoords.longitude,
            lat: currStopCoords.latitude,
            arrival: currTime,
            departure: currTime, //BUS DOESNT WAIT
            vertexType: "TRANSIT"
        };
        currTime += 2 * 60 * 1000; //HARDCODED EACH STOP TAKES 2 MIN
        intermediateStops.push(singularStop);
    };
    return intermediateStops;
};
const _getEncodedPolyLine = (originStopIndex, destStopIndex, service) => {
    //used to attain the polyline for the bus route
    // console.log("service: ", service);
    // console.log(TEMP_SERVICE_CHECKPOINT_BUS_STOP_MAP[service]);
    originStopCheckpointId = TEMP_SERVICE_CHECKPOINT_BUS_STOP_MAP[service][originStopIndex];
    destStopCheckpointId = TEMP_SERVICE_CHECKPOINT_BUS_STOP_MAP[service][destStopIndex];
    try {
        const data = fs.readFileSync(`./routes/${service}CheckPointsCorrected.json`, 'utf-8');
        const checkPointArray = JSON.parse(data).CheckPoint;
        // console.log("check point array: ", checkPointArray);
        let coordsArray = [];
        let flag = false;
        // console.log("origin stop checkpoint id:", originStopCheckpointId);
        // console.log("dest stop checkpoint id:", destStopCheckpointId);
        // console.log("service: ", service);
        for (checkpoint of checkPointArray) {
            if (checkpoint.PointID == originStopCheckpointId) {
                flag = true;
                coordsArray.push([checkpoint.latitude, checkpoint.longitude]);
            } else if (checkpoint.PointID == destStopCheckpointId) {
                flag = false;
                coordsArray.push([checkpoint.latitude, checkpoint.longitude]);
                break;
            } else {
                if (flag) coordsArray.push([checkpoint.latitude, checkpoint.longitude]);
            }
        };
        // console.log("coords array: ", coordsArray);
        return polyline.encode(coordsArray);
    } catch (error) {
        console.error("Error attaining checkpoint files: ", error);
    }
};

router.post("/", async (req, res) => {
    try {
        console.log("origin received: ", req.body.origin);
        console.log("destination received: ", req.body.destination);
        // const turfCurrentLocationCoordsPoint = turf.point([req.body.origin.latitude, req.body.origin.longitude]);
        // const turfDestinationLocationCoords = turf.point([req.body.destination.latitude, req.body.destination.longitude]);
        // if (!(isPointInNUSPolygons(turfCurrentLocationCoordsPoint) && isPointInNUSPolygons(turfDestinationLocationCoords))) {
        //     return res.status(502).json({error:"Both endpoints are not located in NUS"});
        // };
        await populateNusStops(); // can be elimintaed once backend postgresql db is implemented
        // console.log("nus stops after calling fun: ", NUS_STOPS);
        const resultingBusStopFromDest = findNearestBusStopsFromPoints(req.body.destination, NO_OF_BUS_STOPS); //finds nearest bus stops from destination
        const resultingBusStopFromOrigin = findNearestBusStopsFromPoints(req.body.origin, NO_OF_BUS_STOPS);
        const possibleRoutes = await extractCommonBusServices(resultingBusStopFromOrigin, resultingBusStopFromDest); //possible edgecase where origin === dest bus stop, in that case dont bother checking, just factor in walking time
        // console.log("possible routes: ", possibleRoutes);
        populateShuttleRoutes();
        // console.log("possible routes:", await possibleRoutes);
        //no results
        // console.log("possible routes: ", possibleRoutes);
        let viableRoutes = possibleRoutes.map(route => checkViabilityOfRoute(route)).filter(route => route !== undefined);
        // console.log("viable routes: ", viableRoutes);
        const formattedFinalResult = [];
        for (viableRoute of viableRoutes) {
            const busLeg = await formatIntoRoute(req.body.origin, req.body.destination, viableRoute);
            if (busLeg !== undefined) {
                const indexToInsert = binarySearch(formattedFinalResult, busLeg.totalTimeTaken, "totalTimeTaken");
                formattedFinalResult.splice(indexToInsert, 0, busLeg);
            };
        };
        // console.log("formatted final result: ", formattedFinalResult);
        const slicedFormattedFinalResult = formattedFinalResult.slice(0, 3);
        console.log("sliced formatted final result: ", slicedFormattedFinalResult);
        res.json({viableRoutes, slicedFormattedFinalResult});
    } catch (error) {
        console.error("error: ", error);
        res.status(500).json({error: "Check internal logs"});
    }
    });

const populateShuttleRoutes = () => {
    //saves the results into a hashmap, which is faster
    for (route of NUS_SHUTTLE_ROUTES) {
        TEMP_NUS_SHUTTLES_ROUTES.set(route.shuttle, route);
    };
};

const populateNusStops = async () => {
    let result = await fetch("https://nnextbus.nus.edu.sg/BusStops", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization" : `Basic ***REMOVED***`
          //or use this for authorization when building Constants.expoConfig.extra.EXPO_PUBLIC_ONEMAPAPITOKEN
        },
    });
    result = await result.json();
    busStops = result.BusStopsResult.busstops;
    for (busStop of busStops) {
        NUS_STOPS.push(
            {
                "name": busStop.name,
                "latitude": busStop.latitude,
                "longitude": busStop.longitude
            }
        );
        TEMP_NUS_BUS_STOPS_COORDS.set(busStop.name, {"latitude": busStop.latitude, "longitude":busStop.longitude});
    };
    // console.log(NUS_STOPS);
};

const degToRad = (degrees) => {
    return degrees * (Math.PI / 180);
};
const verifyGoogleResult = (resultJSON) => {
    for (geocoderObject of resultJSON.geocoded_waypoints) {
        if (geocoderObject.geocoder_status !== "OK") {
            return false;
        }
    };
    return true;
};

const formatIntoRoute = async (currentCoords,destinationCoords,route) => {
    //bug is here
    //this can be displayed on a result card, but also can be treated as a collection of legs
    //route is of type 
    //"startStop" : route_info[originIndex], "destStop": route_info[destIndex], "noOfStops":(destIndex - originIndex), "service": service, "originStopIndex": originIndex, "destStopIndex": destIndex, "originServiceETA": route.originServiceETA}, we will do reverse searches, and then store the polyline info
    let totalTimeTaken = 0; //(in seconds)
    let originWalkingLeg;
    let destWalkingLeg;
    const originBusStopCoords = TEMP_NUS_BUS_STOPS_COORDS.get(route.startStop);
    const destBustStopCoords = TEMP_NUS_BUS_STOPS_COORDS.get(route.destStop);
    const headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLEMAPSAPIKEY,
        'X-Goog-FieldMask': 'routes.legs.steps.transitDetails'
    };
    const routeFromOriginToNearestBusStop = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${currentCoords.latitude},${currentCoords.longitude}&destination=${originBusStopCoords.latitude},${originBusStopCoords.longitude}&mode=walking&key=${process.env.GOOGLEMAPSAPIKEY}`, {
        method:"GET",
        headers:headers,
    });
    const routeFromNearestBusStopToDest = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${destBustStopCoords.latitude},${destBustStopCoords.longitude}&destination=${destinationCoords.latitude},${destinationCoords.longitude}&mode=walking&key=${process.env.GOOGLEMAPSAPIKEY}`, {
        method:"GET",
        headers:headers,
    });
    const destResult = await routeFromNearestBusStopToDest.json();
    const originResult = await routeFromOriginToNearestBusStop.json();
    console.log("sample origin result:", originResult);
    console.log("walk legs: ", originResult.routes[0].legs);
    console.log("steps :", originResult.routes[0].legs.steps);
    console.log("reached here");
    if (originResult && destResult && verifyGoogleResult(originResult) && verifyGoogleResult(destResult)) {
        // console.log(`walking route from nearest busstop, ${currentCoords} : ${originResult}`);
        // console.log("origin distance in m: ", originResult.routes[0].legs[0].distance.value);
        // console.log("polyline of originLeg: ", originResult.routes[0].overview_polyline);
        const startTimeAtOrigin = Date.now();
        const originWalkingLegSteps = [];
        for (step of originResult.routes[0].legs[0].steps) {
            originWalkingLegSteps.push({
                "distance": step.distance.value,
                "direction" : step.html_instructions.replace("<b>"/g, "").replace("</b>"/g, "") //STOPGAP, CHANGE IF BETTER IMPLEMENTATION
            });
        };
        console.log("originWalkingLegSteps: ", originWalkingLegSteps);
        const originWalkingLegEndTime = startTimeAtOrigin + originResult.routes[0].legs[0].duration.value * 1000;
        originWalkingLeg = {
            startTime: startTimeAtOrigin,
            endTime: originWalkingLegEndTime,
            departureDelay:0,
            realTime:false,
            mode: "WALK",
            route: "",
            from: {
                name: "NUS_START",
                lon: currentCoords.longitude,
                lat: currentCoords.latitude,
                departure: startTimeAtOrigin,
                orig: "",
                vertexType: "NORMAL"
            },
            to: {
                name: route.startStop,
                stopId: "NUS_BUS", //REPLACE WIth STOP ID IN DB
                lon: originBusStopCoords.longitude,
                lat: originBusStopCoords.latitude,
                arrival: originWalkingLegEndTime,
                departure: originWalkingLegEndTime, //HARDCODED 2S
                vertexType: "TRANSIT",
            },
            legGeometry: originResult.routes[0].overview_polyline, //FOR NOW NO LENGTH
            rentedBike: false,
            transitLeg: false,
            duration:originResult.routes[0].legs[0].duration.value,
            intermediateStops:[],
            steps: originWalkingLegSteps,
            numOfIntermediateStops:1,
            };
        const busTravelTime = route.noOfStops * 2 * 60;
        const destWalkingLegStartTime = originWalkingLegEndTime + busTravelTime * 1000;
        const destWalkingLegEndTime = destWalkingLegStartTime + destResult.routes[0].legs[0].duration.value * 1000;
        const destWalkingLegSteps = [];
        for (step of destResult.routes[0].legs[0].steps) {
            destWalkingLegSteps.push({
                distance: step.distance.value,
                direction : step.html_instructions.replace("<b>", "").replace("</b>", "") //STOPGAP, CHANGE IF BETTER IMPLEMENTATION
            });
        };
        const destWalkingLeg = {
            startTime: destWalkingLegStartTime,
            endTime: destWalkingLegEndTime,
            departureDelay:0,
            realTime:false,
            mode: "WALK",
            route: "",
            from: {
                name: route.destStop,
                lon: destBustStopCoords.longitude,
                lat: destBustStopCoords.latitude,
                departure: destWalkingLegStartTime,
                orig: "",
                vertexType: "NORMAL"
            },
            to: {
                name: "DESTINATION",
                stopId: -1, //REPLACE WIth STOP ID IN DB
                lon: destinationCoords.longitude,
                lat: destinationCoords.latitude,
                arrival: destWalkingLegEndTime,
                departure: destWalkingLegEndTime, //HARDCODED 2S
                vertexType: "TRANSIT",
            },
            legGeometry: destResult.routes[0].overview_polyline, //FOR NOW NO LENGTH
            rentedBike: false,
            transitLeg: false,
            duration:destResult.routes[0].legs[0].duration.value,
            intermediateStops:[],
            steps: destWalkingLegSteps,
            numOfIntermediateStops:1,
        };
        // console.log(`walking route from nearest busstop, ${destinationCoords} : ${destResult}`);
        // console.log("time in seconds: ", destResult.routes[0].legs[0].duration.value);
        totalTimeTaken += originResult.routes[0].legs[0].duration.value;
        totalTimeTaken += destResult.routes[0].legs[0].duration.value;
        totalTimeTaken += busTravelTime; //HARDCODED FOR NOW, CHANGE LATER
        totalTimeTaken += route.originServiceETA;
        console.log("ETA: ", route.originServiceETA);
        // console.log("dest distance in m: ", destResult.routes[0].legs[0].distance.value);
        // console.log("polyline of destleg: ", destResult.routes[0].overview_polyline);

        // console.log("total time taken before: ", totalTimeTaken);
        // console.log("total time taken after: ", totalTimeTaken);
        const busLeg = getBusLeg(route, busTravelTime, originWalkingLeg.endTime, originBusStopCoords, destBustStopCoords);
        console.log("bus leg: ", busLeg);
        const currTime = Date.now();
        return {
            duration: totalTimeTaken,
            startTine: currTime,
            endTime:currTime + totalTimeTaken * 1000,
            walkTime: originWalkingLeg.duration + destWalkingLeg.duration,
            legs: [
                originWalkingLeg,
                busLeg,
                destWalkingLeg,
            ],
        };
    } else {
        return undefined;
    }
};

const checkViabilityOfRoute= (route) => {
    const service = route.service;
    const route_info = TEMP_NUS_SHUTTLES_ROUTES.get(service).route;
    // console.log(`route service for ${service} attained: `, route_info);
    let originIndexes = []; //size of at most 2 for both
    let destIndexes = [];
    // console.log("route info length: ", route_info.length);
    for (let index  = 0; index < route_info.length; index++) {
        // console.log("current bus stop: ", route_info[index]);
        if (route_info[index] === route.originBusStop) {
            // console.log('hit');
            originIndexes.push(index);
        } else if (route_info[index] === route.destBusStop) {
            destIndexes.push(index);
        }
    }; 
    // console.log("origin indexes: ", originIndexes);
    // console.log("destination indexes: ", destIndexes);
    if (originIndexes && destIndexes) {
        if (destIndexes[-1] < originIndexes[0]) {
            return undefined;
        } else {
            for (originIndex of originIndexes) {
                for (destIndex of destIndexes) {
                    //for now use first match
                    if (destIndex > originIndex) return {"startStop" : route_info[originIndex], "destStop": route_info[destIndex], "noOfStops":(destIndex - originIndex), "service": service, "originStopIndex": originIndex, "destStopIndex": destIndex, "originServiceETA": route.originServiceETA};
                }
            }
            return undefined;
        }
    } else {
        return undefined;
    }
};

const extractCommonBusServices = async (originBusStops, destBusStops) =>  {
    const originBusServices = [];//[{busStop: "KR-MRT", service: "D1", nextETA:3}] array of shuttles and etas at each bus stop
    const destBusServices = []; // 
    // console.log("origin bus services", originBusServices);
    // console.log("destination shuttle services:", destBusServices);
    // console.log("origin shuttle service querying starts here");
    for (busStop of originBusStops) {
        // console.log("busstop name: ", busStop.name);
        let result = await fetch(`https://nnextbus.nus.edu.sg/ShuttleService?busstopname=${busStop.name}`, {
            method:"GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization" : `Basic ${process.env.NEXTBUS}`
              //or use this for authorization when building Constants.expoConfig.extra.EXPO_PUBLIC_ONEMAPAPITOKEN
            },
        });
        result = await result.json();
        for (shuttle of result.ShuttleServiceResult.shuttles) {
            // console.log("current shuttle: ", shuttle);
            if (shuttle._etas !== undefined && shuttle._etas.length !== 0) {
                originBusServices.push({
                    "busStop":busStop.name,
                    "service":shuttle.name,
                    "nextETA": shuttle._etas[0].eta_s
                });
            }
        };
    };
    console.log("dest shuttle service querying starts here");
    for (busStop of destBusStops) {
        // console.log("busstop name: ", busStop.name);
        //logging the next few etas, when i want it to log only 
        let result = await fetch(`https://nnextbus.nus.edu.sg/ShuttleService?busstopname=${busStop.name}`, {
            method:"GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization" : `Basic ${process.env.NEXTBUS}`
              //or use this for authorization when building Constants.expoConfig.extra.EXPO_PUBLIC_ONEMAPAPITOKEN
            },
        });
        result = await result.json();
        for (shuttle of result.ShuttleServiceResult.shuttles) {
            if (shuttle._etas !== undefined && shuttle._etas.length !== 0) {
                destBusServices.push({
                    "busStop":busStop.name,
                    "service":shuttle.name,
                    "nextETA": shuttle._etas[0].eta_s
                });
            };
        };
    }; //the shuttles are arranged by bus stop which are sorted by distance
    const possibleBusStops = [];
    for (originBusService of originBusServices) {
        for (destBusService of destBusServices) {
            if (originBusService.service === destBusService.service) {
                possibleBusStops.push({
                    "originBusStop": originBusService.busStop,
                    "destBusStop": destBusService.busStop,
                    "service": originBusService.service,
                    "originServiceETA": originBusService.nextETA,
                    "destServiceETA": destBusService.nextETA
                });
            }
        }
    };
    // console.log("possible bus stops before sending", possibleBusStops);
    return possibleBusStops;
};

const calculateEuclideanDistance = (pointLat, pointLongitude, busStopLat, busStopLongitude) => {
    const R  = 6371.0; // approximate radius of Earth in km
    const latRadOrigin = degToRad(pointLat);
    const longRadOrigin = degToRad(pointLongitude);
    const busStopLatRad = degToRad(busStopLat);
    const busStopLongitudeRad = degToRad(busStopLongitude);
    const dLat = busStopLatRad - latRadOrigin;
    const dLong = busStopLongitudeRad - longRadOrigin;
    const a = Math.pow(dLong * Math.cos((busStopLatRad + latRadOrigin) / 2), 2) + Math.pow(dLat, 2);
    const distance = R * Math.sqrt(a);
    return distance;
};

const findNearestBusStopsFromPoints = (pointCoords, noOfBusStops) => {
    const pointLat = pointCoords.latitude;
    const pointLongitude = pointCoords.longitude;
    // console.log("point lat: ", pointLat);
    // console.log("NUS STOPS at this point: ", NUS_STOPS);
    const busStopsSortedByDist = []; //will be an array of json, sorted by the first kv, distance
    for (busStop of NUS_STOPS) {
        const busStopLat = busStop.latitude;
        const busStopLongitude = busStop.longitude;
        const dist = calculateEuclideanDistance(pointLat, pointLongitude, busStopLat, busStopLongitude);
        const index = binarySearch(busStopsSortedByDist, dist, "distance");
        busStopsSortedByDist.splice(index, 0, {
            "name": busStop.name,
            "distance" : dist,
            "latLng": {
                "latitude": busStopLat,
                "longitude": busStopLongitude
            }
        });
    };
    console.log("bus stops array after slicing:", busStopsSortedByDist.slice(0, noOfBusStops));
    return busStopsSortedByDist.slice(0, noOfBusStops);
};

const binarySearch = (arr, element, attribute) => {
    //returns the index to insert an element in a sorted array, based on an attribute
    let left = 0;
    let right = arr.length;
    while (true) {
        mid = Math.floor((right - left) / 2) + left;
        if (left >= right) {
            return left;
        } else if (arr[mid][attribute] < element) {
            //recurse on the right
            left = mid + 1;
        } else if (arr[mid][attribute] == element) {
            return mid;
        } else {
            right = mid;
        }
    }
};
module.exports = router;
