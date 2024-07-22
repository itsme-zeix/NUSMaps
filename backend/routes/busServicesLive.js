const express = require("express");
const polyline = require("@mapbox/polyline");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const NUSNEXTBUSCREDENTIALS = btoa(
    `${process.env.NUSNEXTBUS_USER}:${process.env.NUSNEXTBUS_PASSWORD}`
  );

const NUS_BUS_SERVICES = ["A1", "A2", "BTC", "D1", "D2", "K", "L"];
const CHECKPOINT_MAPPINGS = {}; // looks like {A1 : [{coords}, {coords}]}

function _getCheckPointDataFilePath(service) {
    const filePath = path.join(__dirname, `datafiles/original/${service}CheckPoints.json`);
    return filePath;
};

function loadInCheckPoints() {
    try {
        for (service of NUS_BUS_SERVICES) {
            const data = fs.readFileSync(_getCheckPointDataFilePath(service), "utf-8");
            CHECKPOINT_MAPPINGS[service] = JSON.parse(data).CheckPointResult.CheckPoint;
            console.log(`Checkpoints for ${service} loaded in successfully`);
        };
        return true;
    } catch (error) {
        console.error("Error loading in checkpoints: ", error);
        return false;
    }
};

function getBusCheckPoints(service) {
    const checkPointArray = CHECKPOINT_MAPPINGS[service];
    console.log('service probed: ', service);
    if (checkPointArray !== undefined) {
        return checkPointArray;
    } else {
        console.error("Unable to retrieve checkpoints from existing sources, service:", service);
        throw new Error("Unable to retrieve checkpoints from existing sources");
    };
};

function processSavedData(savedCheckPoints, liveActiveBusResults, service) {
    const checkPointCoordsArray = [];
    for (checkPoint of savedCheckPoints) {
        const checkPointCoords = [checkPoint.latitude, checkPoint.longitude]; //can be converted to polyline str to save on data transmission
        checkPointCoordsArray.push(checkPointCoords);
        // if (checkPoint.NUS_BUS_STOP == "true") {
        //     busStopsCoordsArray.push({latitude: checkPoint.latitude, longitude: checkPoint.longitude, name: checkPoint.name}); //fewer stops so the benefits of the names > cost of tranmission
        // };
    };
    
    const busStopMarkersCoords = fs.readFileSync(path.join(__dirname, `datafiles/busstops/${service}BusStops.json`), "utf-8"); //reads the coords for the bus stops
    const busStopsCoordsArray = JSON.parse(busStopMarkersCoords);
    const processedActiveBuses = _processActiveBusData(liveActiveBusResults);
    return [checkPointCoordsArray, busStopsCoordsArray, processedActiveBuses];
}
loadInCheckPoints();

function _convertCoordsArrayToPolyline(coordsArray) {
    const encodedStr = polyline.encode(coordsArray);
    return encodedStr;
};

function _processActiveBusData(liveActiveBusResults) {
    const activeBusIntermediate = liveActiveBusResults.ActiveBusResult;
    const processedActiveBuses = [];
    let activeBusArray = undefined;
    if (activeBusIntermediate.ActiveBusCount != "0") {
        activeBusArray = activeBusIntermediate.activebus;
        console.log('active bus arr:', activeBusArray);
    };
    if (activeBusArray != undefined) {
        for (activeBus of activeBusArray) {
            processedActiveBuses.push({
                latitude: activeBus.lat,
                longitude: activeBus.lng,
                direction: activeBus.direction,
                crowdLevel: activeBus.loadInfo.crowdLevel,
                licensePlate: activeBus.vehplate
            });
        };
    };
    return processedActiveBuses;
}


router.post("/", async (req, res) => {
    //accepts 2 kinds of requests, 
    //1. request for route
    //2. request for services operating out of a bus stop
    const service = req.body.service;
    const requestType = req.body.requestType;
    if (service !== undefined && requestType == "fetchAll") {
        try {
            const checkPoints = getBusCheckPoints(service);
            const activeBusResponse = await axios.get(`https://nnextbus.nus.edu.sg/ActiveBus?route_code=${service}`, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${NUSNEXTBUSCREDENTIALS}`,
            }
        });
        const activeBusData = activeBusResponse.data;
        const [checkPointCoordsArray, busStopsCoordsArray, processedActiveBuses] = processSavedData(checkPoints, activeBusData, service);
        const checkPointPolylineString = _convertCoordsArrayToPolyline(checkPointCoordsArray);
        res.json({checkPointPolylineString, busStopsCoordsArray, processedActiveBuses});
        } catch (error) {
            console.error("Error retrieving live bus locations and bus checkpoints: ", error);
            res.status(500).json({error: "Check internal logs for live bus location failure and checkpoint reading failures"});
        };
    } else if (service !== undefined && requestType == "fetchActiveBus") {
        try {
            const activeBusResponse = await axios.get(`https://nnextbus.nus.edu.sg/ActiveBus?route_code=${service}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Basic ${NUSNEXTBUSCREDENTIALS}`,
                }
            });
            return res.json(_processActiveBusData(activeBusResponse.data));
        } catch (error) {
            console.error("Error retrieving updated live bus locations: ", error);
            res.status(500).json({error: "Check internal logs for live bus location failure"});
        }
    }
});
module.exports = router;