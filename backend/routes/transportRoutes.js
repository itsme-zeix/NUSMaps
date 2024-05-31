var express = require("express");
var router = express.Router();

/* GET routes */
router.get("/transportRoutes", function (req, res, next) {
  res.send("respond with a resource");
});

const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
app.post("/transportRoutes", (req, res) => {
  //include a way to read the request as a json object to get the latitude and longitude
  var payload = {
    origin: {
      location: {
        latLng: {
          latitude: req.body.origin.latitude,
          longitude: req.body.origin.longitude,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: req.body.destination.latitude,
          longitude: req.body.destination.latitud,
        },
      },
    },
    travelMode: "TRANSIT",
    computeAlternativeRoutes: "true",
    transitPreferences: {
      routingPreferences: "LESS_WALKING",
      allowedTravelModes: ["BUS", "SUBWAY", "TRAIN", "LIGHT_RAIL", "RAIL"],
    },
  };
  //intermediate to get back the json of transit
  //implement a function to process the data
  return res.post(url);
});

module.exports = router;
