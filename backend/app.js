const express = require("express");
const createError = require("http-errors");
const path = require("path");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000; // defaults to 3000
app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});

// Routing
const busArrivalTimesRouter = require("./routes/busArrivalTimes");
const transportRoutesRouter = require("./routes/transportroutes");

app.use("/transportRoutes", transportRoutesRouter);
//attaining destination place id 
app.use("/busArrivalTimes", busArrivalTimesRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
