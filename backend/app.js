var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
//internal routing here
const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
app.post('/getRoute', (req, res) => {
  //include a way to read the request as a json object to get the latitude and longitude
  var payload = {
    "origin": {
    "location":
      {
        "latLng":
        {
          "latitude":req.body.origin.latitude,
          "longitude":req.body.origin.longitude
        }
      }
    },
    "destination": {
      "location":
      {
        "latLng":
        {
          "latitude":req.body.destination.latitude,
          "longitude":req.body.destination.latitud,
        }    
      }
    },
    "travelMode": "TRANSIT",
    "computeAlternativeRoutes": "true",
    "transitPreferences": {
      "routingPreferences": "LESS_WALKING",
      "allowedTravelModes": ["BUS", "SUBWAY", "TRAIN", "LIGHT_RAIL", "RAIL"]
    }
  };
  //intermediate to get back the json of transit
  //implement a function to process the data
  return res.post(url);
});
  
module.exports = app;
