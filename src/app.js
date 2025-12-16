const express = require("express");
const app = express();
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const logger = require("./utils/logger");

// Middleware to parse JSON requests
app.use(express.json({ limit: "10kb" })); // limit will allow json up to 10kb
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static("public")); // Serve static files
// Enable CORS
app.use(cors());
// Parse cookies
app.use(cookieParser());

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
