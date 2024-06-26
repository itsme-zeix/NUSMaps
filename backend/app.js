const express = require("express");
const createError = require("http-errors");
const path = require("path");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0"; // Bind to 0.0.0.0 as required by Render server

// Debug
app.get("/", function (req, res) {
  res.send("Hello World!");
});

// Import routes
const cacheDataRouter = require("./routes/cacheData");
const transportRouteRouter = require("./routes/transportRoute");
const busArrivalTimesRouter = require("./routes/busArrivalTimes");
const busStopsByLocationRouter = require("./routes/busStopsByLocation");
const nusBusStopsRouter = require("./routes/nusBusStops");

// Use routes
app.use("/busArrivalTimes", busArrivalTimesRouter);
app.use("/cacheData", cacheDataRouter);
app.use("/transportRoute", transportRouteRouter);
app.use("/busStopsByLocation", busStopsByLocationRouter);
app.use("/nusBusStops", nusBusStopsRouter);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  // Set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // Send the error response
  res.status(err.status || 500);
  res.json({
    message: res.locals.message,
    error: res.locals.error,
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Server Listening on http://${HOST}:${PORT}`);
});

module.exports = app;
