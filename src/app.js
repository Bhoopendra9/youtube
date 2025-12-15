const express = require("express");
const app = express();
const morgan = require("morgan");
const logger = require("./utils/logger");

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Morgan stream → Winston
const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  },
};
// HTTP request logging
app.use(morgan("combined", { stream: morganStream }));

// Sample route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

module.exports = app;
